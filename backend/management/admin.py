from django.contrib import admin
from .models import House, Room, Tenant, Contract, Payment, Expense

@admin.register(House)
class HouseAdmin(admin.ModelAdmin):
    list_display = ('name', 'address', 'bank_name', 'bank_account', 'bank_owner', 'bank_transfer_prefix')
    search_fields = ('name', 'address', 'bank_name', 'bank_account')

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('room_code', 'room_name', 'house', 'price', 'area', 'status')
    list_filter = ('status', 'house')
    search_fields = ('room_code', 'room_name')

@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'phone', 'citizen_id')
    search_fields = ('full_name', 'phone', 'citizen_id')

@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ('tenant', 'room', 'start_date', 'end_date', 'rent_price', 'is_active')
    list_filter = ('is_active', 'room__house')
    search_fields = ('tenant__full_name', 'room__room_name')

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('room', 'month', 'total_amount', 'payment_status', 'created_at')
    list_filter = ('payment_status', 'month', 'room__house')
    search_fields = ('room__room_name', 'room__room_code')

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('description', 'house', 'amount', 'date', 'category')
    list_filter = ('category', 'date', 'house')
    search_fields = ('description',)
