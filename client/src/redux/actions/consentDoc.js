import { createCrudActions } from '../utils';

export const {
        fetchAll: fetchConsentDocs,
        fetchOne: fetchConsentDoc,
        create: createConsentDoc,
        update: updateConsentDoc,
        remove: deleteConsentDoc,
        removeAll: deleteAllConsentDocs,
} = createCrudActions('consent_docs');
