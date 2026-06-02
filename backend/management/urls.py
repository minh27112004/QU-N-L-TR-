from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from .views import HouseViewSet, RoomViewSet, TenantViewSet, ContractViewSet, PaymentViewSet, ExpenseViewSet, DashboardStatsView, LogoutView

router = DefaultRouter()
router.register(r'houses', HouseViewSet, basename='house')
router.register(r'rooms', RoomViewSet, basename='room')
router.register(r'tenants', TenantViewSet, basename='tenant')
router.register(r'contracts', ContractViewSet, basename='contract')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'expenses', ExpenseViewSet, basename='expense')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('login/', obtain_auth_token, name='api-login'),
    path('logout/', LogoutView.as_view(), name='api-logout'),
]
