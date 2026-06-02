from django.db import models
from django.core.exceptions import ValidationError
from decimal import Decimal

class House(models.Model):
    name = models.CharField(max_length=100, verbose_name="Tên nhà trọ")
    address = models.CharField(max_length=255, verbose_name="Địa chỉ")
    bank_name = models.CharField(max_length=100, blank=True, default="VIETCOMBANK (VCB)", verbose_name="Tên ngân hàng")
    bank_account = models.CharField(max_length=50, blank=True, default="7373700107", verbose_name="Số tài khoản")
    bank_owner = models.CharField(max_length=100, blank=True, default="PHẠM VĂN QUANG", verbose_name="Chủ tài khoản")
    bank_transfer_prefix = models.CharField(max_length=20, blank=True, default="TS", verbose_name="Mã viết tắt chuyển khoản (VD: TS)")
    
    # Utility price configurations per house
    elec_price = models.DecimalField(max_digits=12, decimal_places=2, default=3800.00, verbose_name="Đơn giá điện")
    water_price = models.DecimalField(max_digits=12, decimal_places=2, default=35000.00, verbose_name="Đơn giá nước")
    service_price = models.DecimalField(max_digits=12, decimal_places=2, default=100000.00, verbose_name="Đơn giá dịch vụ")
    internet_price = models.DecimalField(max_digits=12, decimal_places=2, default=100000.00, verbose_name="Tiền Internet")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Nhà trọ"
        verbose_name_plural = "Danh sách nhà trọ"
        ordering = ['name']


class Room(models.Model):
    STATUS_CHOICES = [
        ('empty', 'Trống'),
        ('rented', 'Đang thuê'),
    ]
    
    house = models.ForeignKey(House, on_delete=models.CASCADE, related_name='rooms', verbose_name="Thuộc nhà")
    room_code = models.CharField(max_length=20, unique=True, verbose_name="Mã phòng")
    room_name = models.CharField(max_length=100, verbose_name="Tên phòng")
    price = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Giá thuê hàng tháng")
    area = models.FloatField(verbose_name="Diện tích (m²)")
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='empty', 
        verbose_name="Trạng thái"
    )

    def __str__(self):
        return f"{self.room_name} - {self.house.name} ({self.room_code})"

    class Meta:
        verbose_name = "Phòng trọ"
        verbose_name_plural = "Danh sách phòng trọ"
        ordering = ['room_code']


class Tenant(models.Model):
    full_name = models.CharField(max_length=150, verbose_name="Họ tên")
    phone = models.CharField(max_length=20, verbose_name="Số điện thoại")
    citizen_id = models.CharField(max_length=20, unique=True, verbose_name="Số CCCD")
    address = models.TextField(blank=True, null=True, verbose_name="Địa chỉ")

    def __str__(self):
        return self.full_name

    class Meta:
        verbose_name = "Người thuê"
        verbose_name_plural = "Danh sách người thuê"
        ordering = ['full_name']


class Contract(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='contracts', verbose_name="Người thuê")
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='contracts', verbose_name="Phòng thuê")
    start_date = models.DateField(verbose_name="Ngày bắt đầu")
    end_date = models.DateField(verbose_name="Ngày kết thúc")
    deposit = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Tiền cọc")
    rent_price = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Giá thuê")
    is_active = models.BooleanField(default=True, verbose_name="Đang hiệu lực")
    occupants_count = models.IntegerField(default=1, verbose_name="Số người ở")

    def clean(self):
        # Validate that start_date is before end_date
        if self.start_date and self.end_date and self.start_date >= self.end_date:
            raise ValidationError("Ngày bắt đầu phải trước ngày kết thúc.")
            
        # Check if room is already rented by another active contract (excluding self)
        if self.is_active:
            conflicting_contracts = Contract.objects.filter(
                room=self.room,
                is_active=True
            )
            if self.pk:
                conflicting_contracts = conflicting_contracts.exclude(pk=self.pk)
            
            if conflicting_contracts.exists():
                raise ValidationError(f"Phòng {self.room.room_name} hiện đã có hợp đồng thuê hoạt động.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
        
        # Automatically update Room status
        if self.is_active:
            self.room.status = 'rented'
            self.room.save(update_fields=['status'])
        else:
            # If contract is deactivated, verify if there are any other active contracts for the room
            has_other_active = Contract.objects.filter(room=self.room, is_active=True).exists()
            if not has_other_active:
                self.room.status = 'empty'
                self.room.save(update_fields=['status'])

    def delete(self, *args, **kwargs):
        room = self.room
        super().delete(*args, **kwargs)
        # Check if there are other active contracts for this room after deletion
        has_other_active = Contract.objects.filter(room=room, is_active=True).exists()
        if not has_other_active:
            room.status = 'empty'
            room.save(update_fields=['status'])

    def __str__(self):
        return f"Hợp đồng - {self.tenant.full_name} - {self.room.room_name}"

    class Meta:
        verbose_name = "Hợp đồng"
        verbose_name_plural = "Danh sách hợp đồng"
        ordering = ['-start_date']


class Payment(models.Model):
    STATUS_CHOICES = [
        ('unpaid', 'Chưa thanh toán'),
        ('paid', 'Đã thanh toán'),
    ]

    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='payments', verbose_name="Phòng")
    month = models.CharField(max_length=7, verbose_name="Tháng (YYYY-MM)") # format: YYYY-MM
    room_fee = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Tiền phòng")
    
    # Detailed utility indicators and pricing
    elec_old = models.IntegerField(default=0, verbose_name="Chỉ số điện cũ")
    elec_new = models.IntegerField(default=0, verbose_name="Chỉ số điện mới")
    elec_price = models.DecimalField(max_digits=12, decimal_places=2, default=3800.00, verbose_name="Đơn giá điện")
    
    water_old = models.IntegerField(default=0, verbose_name="Chỉ số nước cũ")
    water_new = models.IntegerField(default=0, verbose_name="Chỉ số nước mới")
    water_price = models.DecimalField(max_digits=12, decimal_places=2, default=35000.00, verbose_name="Đơn giá nước")
    
    service_people = models.IntegerField(default=1, verbose_name="Số người dịch vụ")
    service_price = models.DecimalField(max_digits=12, decimal_places=2, default=100000.00, verbose_name="Đơn giá dịch vụ")
    
    internet_price = models.DecimalField(max_digits=12, decimal_places=2, default=100000.00, verbose_name="Tiền Internet")
    surcharge = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, verbose_name="Phụ phí")
    surcharge_desc = models.CharField(max_length=255, blank=True, default="", verbose_name="Lý do phụ phí")

    electricity_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name="Tiền điện")
    water_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name="Tiền nước")
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, editable=False, verbose_name="Tổng tiền")
    payment_status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='unpaid', 
        verbose_name="Trạng thái thanh toán"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày tạo")

    def save(self, *args, **kwargs):
        # Auto populate service_people from active contract occupants_count if creating a new invoice and service_people is default (1) or 0
        if not self.pk and (self.service_people == 1 or self.service_people == 0):
            active_contract = Contract.objects.filter(room=self.room, is_active=True).first()
            if active_contract:
                self.service_people = active_contract.occupants_count
                
        # Auto populate default utility rates from room's house on creation
        if not self.pk:
            house = self.room.house
            if self.elec_price == 3800.00 or self.elec_price == 0:
                self.elec_price = house.elec_price
            if self.water_price == 35000.00 or self.water_price == 0:
                self.water_price = house.water_price
            if self.service_price == 100000.00 or self.service_price == 0:
                self.service_price = house.service_price
            if self.internet_price == 100000.00 or self.internet_price == 0:
                self.internet_price = house.internet_price

        # Auto calculate electricity fee if indices are provided
        if self.elec_new > 0 or self.elec_old > 0:
            used = max(0, self.elec_new - self.elec_old)
            self.electricity_fee = Decimal(str(used)) * Decimal(str(self.elec_price))

        # Auto calculate water fee if indices are provided
        if self.water_new > 0 or self.water_old > 0:
            used = max(0, self.water_new - self.water_old)
            self.water_fee = Decimal(str(used)) * Decimal(str(self.water_price))

        # Auto fill room_fee from room price if not provided
        if self.room_fee is None or self.room_fee == 0:
            self.room_fee = self.room.price
        
        # Calculate total amount including surcharge
        self.total_amount = (
            Decimal(str(self.room_fee)) + 
            Decimal(str(self.electricity_fee)) + 
            Decimal(str(self.water_fee)) + 
            (Decimal(str(self.service_people)) * Decimal(str(self.service_price))) + 
            Decimal(str(self.internet_price)) +
            Decimal(str(self.surcharge))
        )
        super().save(*args, **kwargs)

    def __str__(self):
        status_str = "Đã thanh toán" if self.payment_status == 'paid' else "Chưa thanh toán"
        return f"Phiếu thu - {self.room.room_name} - Tháng {self.month} ({status_str})"

    class Meta:
        verbose_name = "Phiếu thu tiền"
        verbose_name_plural = "Danh sách phiếu thu"
        ordering = ['-month', '-created_at']
        unique_together = ('room', 'month') # Avoid double billing the same room in one month


class Expense(models.Model):
    CATEGORY_CHOICES = [
        ('repair', 'Sửa chữa & Bảo trì'),
        ('utility', 'Điện nước chung'),
        ('tax', 'Thuế & Phí'),
        ('other', 'Chi phí khác'),
    ]
    house = models.ForeignKey(House, on_delete=models.CASCADE, related_name='expenses', verbose_name="Thuộc nhà")
    description = models.CharField(max_length=255, verbose_name="Mô tả chi phí")
    amount = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Số tiền chi")
    date = models.DateField(verbose_name="Ngày chi")
    category = models.CharField(
        max_length=50, 
        choices=CATEGORY_CHOICES, 
        default='other', 
        verbose_name="Danh mục"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày tạo")

    def __str__(self):
        return f"Chi phí - {self.description} ({self.amount}đ)"

    class Meta:
        verbose_name = "Chi phí"
        verbose_name_plural = "Danh sách chi phí"
        ordering = ['-date', '-created_at']
