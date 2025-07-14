import { createCrudActions } from '../utils';

const {
        fetchAll: fetchAirlines,
        fetchOne: fetchAirline,
        create: createAirline,
        update: updateAirline,
        remove: deleteAirline,
} = createCrudActions('airlines');

export {
        fetchAirlines,
        fetchAirline,
        createAirline,
        updateAirline,
        deleteAirline,
};
