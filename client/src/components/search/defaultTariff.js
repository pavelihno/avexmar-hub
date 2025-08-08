export const getDefaultTariffId = (tariffs, seatClassParam, urlTariffId) => {
        if (urlTariffId && tariffs.some((t) => t.id === urlTariffId)) {
                return urlTariffId;
        }
        if (seatClassParam) {
                const classTariffs = tariffs.filter((t) => t.seat_class === seatClassParam);
                if (classTariffs.length) {
                        return classTariffs[0].id;
                }
        }
        return tariffs[0]?.id;
};
