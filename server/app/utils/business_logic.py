def get_seats_number(params):
    return (
        int(params.get('adults', 0)) + 
        int(params.get('children', 0)) + 
        int(params.get('infants_seat', 0))
    )
