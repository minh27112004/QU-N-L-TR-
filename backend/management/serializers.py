from rest_framework import serializers
from .models import House, Room, Tenant, Contract, Payment, Expense

class HouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = House
        fields = '__all__'


class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = '__all__'

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['house_name'] = instance.house.name
        return rep


class TenantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tenant
        fields = '__all__'


class ContractSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contract
        fields = '__all__'

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['room_code'] = instance.room.room_code
        rep['room_name'] = instance.room.room_name
        rep['house_name'] = instance.room.house.name
        rep['tenant_name'] = instance.tenant.full_name
        rep['tenant_phone'] = instance.tenant.phone
        return rep


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ('total_amount',)

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['room_code'] = instance.room.room_code
        rep['room_name'] = instance.room.room_name
        rep['house_name'] = instance.room.house.name
        return rep


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['house_name'] = instance.house.name
        return rep
