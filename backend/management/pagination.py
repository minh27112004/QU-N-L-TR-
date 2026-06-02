from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

class OptionalPageNumberPagination(PageNumberPagination):
    page_size = 6
    page_size_query_param = 'page_size'
    max_page_size = 100

    def paginate_queryset(self, queryset, request, view=None):
        # Allow disabling pagination with no_pagination=true query parameter
        no_pagination = request.query_params.get('no_pagination', 'false').lower() == 'true'
        if no_pagination:
            return None
        return super().paginate_queryset(queryset, request, view)
