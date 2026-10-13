import { setGlobalOptions } from 'firebase-functions/v2';
import { initializeApp } from 'firebase-admin/app';

initializeApp();

setGlobalOptions({
  region: 'asia-northeast3', // 서울 리전
  maxInstances: 10,
});

export { onNewContact } from './contact';
export { submitApplication, checkPromoCode } from './applications/callables';
export { onApplicationCreated, onApplicationWritten, onTourConfigWritten } from './applications/triggers';
