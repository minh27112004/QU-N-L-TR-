import datetime
from django.core.management.base import BaseCommand
from django.utils import timezone
from management.models import House, Room, Tenant, Contract, Payment, Expense

class Command(BaseCommand):
    help = 'Seeds database with initial rental management data including houses and expenses'

    def handle(self, *args, **options):
        self.stdout.write('Clearing existing data...')
        Expense.objects.all().delete()
        Payment.objects.all().delete()
        Contract.objects.all().delete()
        Tenant.objects.all().delete()
        Room.objects.all().delete()
        House.objects.all().delete()

        self.stdout.write('Seeding Houses...')
        houses = [
            House(name='Tòa nhà A (Cầu Giấy)', address='Số 12 Cầu Giấy, Hà Nội'),
            House(name='Khu nhà B (Thanh Xuân)', address='Số 85 Nguyễn Trãi, Thanh Xuân, Hà Nội'),
        ]
        House.objects.bulk_create(houses)
        db_houses = House.objects.all()
        house_a = db_houses[0]
        house_b = db_houses[1]

        self.stdout.write('Seeding Rooms linked to Houses...')
        rooms = [
            # House A
            Room(house=house_a, room_code='P101', room_name='Phòng 101 (Tầng 1)', price=2500000.00, area=15.0, status='empty'),
            Room(house=house_a, room_code='P102', room_name='Phòng 102 (Tầng 1)', price=2800000.00, area=18.0, status='empty'),
            Room(house=house_a, room_code='P201', room_name='Phòng 201 (Tầng 2)', price=3200000.00, area=20.0, status='empty'),
            
            # House B
            Room(house=house_b, room_code='P202', room_name='Phòng 202 (Tầng 2)', price=3000000.00, area=18.0, status='empty'),
            Room(house=house_b, room_code='P301', room_name='Phòng 301 (Tầng 3)', price=4500000.00, area=25.0, status='empty'),
            Room(house=house_b, room_code='P302', room_name='Phòng 302 (Tầng 3)', price=4200000.00, area=22.0, status='empty'),
        ]
        Room.objects.bulk_create(rooms)
        db_rooms = {r.room_code: r for r in Room.objects.all()}

        self.stdout.write('Seeding Tenants...')
        tenants = [
            Tenant(full_name='Nguyễn Văn An', phone='0912345678', citizen_id='123456789012', address='Thanh Xuân, Hà Nội'),
            Tenant(full_name='Trần Thị Bình', phone='0987654321', citizen_id='987654321098', address='Hải Châu, Đà Nẵng'),
            Tenant(full_name='Lê Hoàng Cường', phone='0905123456', citizen_id='456789012345', address='Quận 1, TP. Hồ Chí Minh'),
            Tenant(full_name='Phạm Minh Đức', phone='0944112233', citizen_id='789012345678', address='Ý Yên, Nam Định'),
        ]
        Tenant.objects.bulk_create(tenants)
        db_tenants = Tenant.objects.all()

        self.stdout.write('Seeding Contracts...')
        # Contract 1: Nguyen Van An -> Room P201 (House A)
        c1 = Contract(
            tenant=db_tenants[0],
            room=db_rooms['P201'],
            start_date=datetime.date(2026, 1, 1),
            end_date=datetime.date(2027, 1, 1),
            deposit=3200000.00,
            rent_price=3200000.00,
            is_active=True
        )
        c1.save()

        # Contract 2: Tran Thi Binh -> Room P202 (House B)
        c2 = Contract(
            tenant=db_tenants[1],
            room=db_rooms['P202'],
            start_date=datetime.date(2026, 2, 15),
            end_date=datetime.date(2027, 2, 15),
            deposit=3000000.00,
            rent_price=3000000.00,
            is_active=True
        )
        c2.save()

        # Contract 3: Le Hoang Cuong -> Room P301 (House B) (Terminated)
        c3 = Contract(
            tenant=db_tenants[2],
            room=db_rooms['P301'],
            start_date=datetime.date(2026, 1, 1),
            end_date=datetime.date(2026, 5, 1),
            deposit=4500000.00,
            rent_price=4500000.00,
            is_active=False
        )
        c3.save()

        self.stdout.write('Seeding Payments (History)...')
        payments = [
            # Room P201 (Rent price: 3,200,000, 1 person)
            Payment(room=db_rooms['P201'], month='2026-02', room_fee=3200000.00, elec_old=100, elec_new=139, water_old=10, water_new=12, service_people=1, payment_status='paid'),
            Payment(room=db_rooms['P201'], month='2026-03', room_fee=3200000.00, elec_old=139, elec_new=186, water_old=12, water_new=14, service_people=1, payment_status='paid'),
            Payment(room=db_rooms['P201'], month='2026-04', room_fee=3200000.00, elec_old=186, elec_new=244, water_old=14, water_new=16, service_people=1, payment_status='paid'),
            Payment(room=db_rooms['P201'], month='2026-05', room_fee=3200000.00, elec_old=244, elec_new=299, water_old=16, water_new=18, service_people=1, payment_status='paid'),
            Payment(room=db_rooms['P201'], month='2026-06', room_fee=3200000.00, elec_old=299, elec_new=365, water_old=18, water_new=20, service_people=1, payment_status='unpaid'),

            # Room P202 (Rent price: 3,000,000, 2 people, June has 6,400,000 and 4 people)
            Payment(room=db_rooms['P202'], month='2026-03', room_fee=3000000.00, elec_old=9000, elec_new=9026, water_old=300, water_new=302, service_people=2, payment_status='paid'),
            Payment(room=db_rooms['P202'], month='2026-04', room_fee=3000000.00, elec_old=9026, elec_new=9058, water_old=302, water_new=304, service_people=2, payment_status='paid'),
            Payment(room=db_rooms['P202'], month='2026-05', room_fee=3000000.00, elec_old=9058, elec_new=9095, water_old=304, water_new=306, service_people=2, payment_status='paid'),
            # June invoice matching user's image exactly!
            Payment(
                room=db_rooms['P202'], 
                month='2026-06', 
                room_fee=6400000.00, 
                elec_old=9468, 
                elec_new=10020, 
                elec_price=3800.00,
                water_old=389, 
                water_new=406, 
                water_price=35000.00,
                service_people=4, 
                service_price=100000.00, 
                internet_price=100000.00,
                payment_status='unpaid'
            ),

            # Room P301 (Rent price: 4,500,000, 3 people)
            Payment(room=db_rooms['P301'], month='2026-02', room_fee=4500000.00, elec_old=500, elec_new=565, water_old=50, water_new=53, service_people=3, payment_status='paid'),
            Payment(room=db_rooms['P301'], month='2026-03', room_fee=4500000.00, elec_old=565, elec_new=638, water_old=53, water_new=56, service_people=3, payment_status='paid'),
            Payment(room=db_rooms['P301'], month='2026-04', room_fee=4500000.00, elec_old=638, elec_new=720, water_old=56, water_new=59, service_people=3, payment_status='paid'),
        ]
        for p in payments:
            p.save()

        self.stdout.write('Seeding Expenses...')
        expenses = [
            # House A
            Expense(house=house_a, description='Sửa vòi hoa sen phòng 201', amount=150000.00, date=datetime.date(2026, 2, 10), category='repair'),
            Expense(house=house_a, description='Tiền điện hành lang + máy bơm tổng', amount=850000.00, date=datetime.date(2026, 2, 28), category='utility'),
            Expense(house=house_a, description='Sửa khóa cổng vân tay', amount=500000.00, date=datetime.date(2026, 3, 5), category='repair'),
            Expense(house=house_a, description='Tiền điện máy bơm + đèn chung', amount=920000.00, date=datetime.date(2026, 3, 30), category='utility'),
            Expense(house=house_a, description='Mua chổi lau nhà + sọt rác công cộng', amount=120000.00, date=datetime.date(2026, 4, 1), category='other'),
            Expense(house=house_a, description='Phí thu gom rác chung tháng 4', amount=300000.00, date=datetime.date(2026, 4, 15), category='tax'),
            Expense(house=house_a, description='Tiền điện chiếu sáng công cộng', amount=780000.00, date=datetime.date(2026, 4, 29), category='utility'),
            Expense(house=house_a, description='Thay bóng đèn cầu thang tầng 2', amount=80000.00, date=datetime.date(2026, 5, 3), category='repair'),
            Expense(house=house_a, description='Tiền điện chiếu sáng và nước tổng', amount=890000.00, date=datetime.date(2026, 5, 28), category='utility'),
            Expense(house=house_a, description='Thuế kinh doanh nhà trọ', amount=1500000.00, date=datetime.date(2026, 5, 15), category='tax'),
            Expense(house=house_a, description='Bảo dưỡng hệ thống camera', amount=600000.00, date=datetime.date(2026, 6, 1), category='repair'),

            # House B
            Expense(house=house_b, description='Hút bể phốt định kỳ', amount=2200000.00, date=datetime.date(2026, 3, 12), category='repair'),
            Expense(house=house_b, description='Thanh toán tiền nước tổng', amount=1250000.00, date=datetime.date(2026, 3, 28), category='utility'),
            Expense(house=house_b, description='Hóa đơn internet cáp quang tổng', amount=350000.00, date=datetime.date(2026, 4, 5), category='utility'),
            Expense(house=house_b, description='Sửa mái tôn chống dột hành lang', amount=1800000.00, date=datetime.date(2026, 4, 18), category='repair'),
            Expense(house=house_b, description='Hóa đơn internet cáp quang tổng', amount=350000.00, date=datetime.date(2026, 5, 5), category='utility'),
            Expense(house=house_b, description='Tiền nước và điện chung nhà B', amount=1420000.00, date=datetime.date(2026, 5, 29), category='utility'),
            Expense(house=house_b, description='Thay bình chữa cháy mini hỏng', amount=450000.00, date=datetime.date(2026, 6, 2), category='other'),
        ]
        Expense.objects.bulk_create(expenses)

        self.stdout.write(self.style.SUCCESS('Successfully seeded database with houses and expenses!'))
