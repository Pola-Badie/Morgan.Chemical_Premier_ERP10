// Legacy storage.ts file - now redirects to modular storage architecture
export { storage } from "./storage/index";
export type { 
  IUserStorage, IProductStorage, ICustomerStorage, ISupplierStorage,
  IPharmaceuticalStorage, IFinancialStorage, IInventoryStorage
} from "./storage/interfaces";