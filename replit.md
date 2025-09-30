# Premier ERP System

## Overview
The Premier ERP System is a comprehensive Enterprise Resource Planning dashboard designed for the chemical manufacturing industry. Its main purpose is to provide advanced data visualization and dynamic status tracking for products, inventory, and financial management. This system aims to streamline operations, enhance decision-making through real-time analytics, and ensure compliance with industry-specific regulations. Key capabilities include integrated procurement, accounting, and financial modules, alongside robust product and user management. The vision is to deliver a highly functional, stable, and production-ready ERP solution tailored for chemical manufacturing businesses, enabling efficient resource planning and substantial market potential.

## User Preferences
- System branding must use "Premier" ERP System specifically
- Focus on chemical manufacturing industry requirements
- Prioritize pharmaceutical compliance features (expiry tracking, ETA numbers)
- Maintain responsive design for mobile and desktop usage
- Implement comprehensive financial tracking and reporting
- ETA integration should show proper status indicators instead of fake/hardcoded numbers when credentials are not configured

## System Architecture

### UI/UX Decisions
The system features a responsive design optimized for both mobile and desktop usage. It utilizes Tailwind CSS for styling and shadcn/ui components for a consistent, modern user interface. Bilingual support (English/Arabic) with Right-to-Left (RTL) layout capabilities is implemented across all pages. A 12-column grid system is standardized for all layouts.

### Technical Implementations
- **Frontend:** React TypeScript with Vite, Tailwind CSS, shadcn/ui. React Query is used for data fetching, caching, and state management.
- **Backend:** Express.js with TypeScript provides comprehensive API endpoints for all ERP modules. Modular route handlers (`routes-*.ts`) ensure organized and maintainable code.
- **Database:** PostgreSQL with Drizzle ORM is used for robust data storage and relational integrity.
- **State Management:** React Context API for global state, especially for bilingual support.
- **Internationalization:** Comprehensive translation management with dynamic keys for English and Arabic across all components and dialogs.
- **Financial Calculations:** Backend handles complex financial calculations, ensuring consistency between frontend display and database storage.

### Feature Specifications
- **Dashboard:** Real-time analytics, integrated accounting metrics, business intelligence, and interactive alerts for inventory.
- **Procurement Module:** Includes expiry tracking, dual discount system (percentage/amount), automatic calculations, and status workflow (sent, received, rejected).
- **Accounting Module:** Automated journal entry creation, customer accounts history, payment tracking, and integration with Egyptian Tax Authority (ETA) for e-invoicing compliance. All financial reports (P&L, Trial Balance, Balance Sheet, Cash Flow, Chart of Accounts, Journal Entries, General Ledger, Account Summary) are dynamically generated from real data.
- **Inventory Management:** Advanced filtering, warehouse management, CSV import/export with warehouse selection, upsert functionality for duplicate SKU handling, and prevention of negative inventory quantities.
- **Invoice & Quotation Management:** Features PDF generation, automated sequential invoice numbering, and ETA integration.
- **Expenses Tracking:** Receipt management and reporting with automatic accounting synchronization.
- **Order Management & Suppliers:** Includes approval workflows and contact tracking.
- **User Management:** Role-based permissions with dynamic access control for all ERP modules.
- **System Preferences:** Comprehensive configuration settings for company info, currency (EGP), timezone, etc.

### System Design Choices
- **Modular Architecture:** Frontend and backend are structured modularly for scalability and maintainability.
- **Containerization:** Docker with multi-stage Dockerfiles and Docker Compose for development and production deployment, including health checks and persistent volume mounts.
- **Performance Optimization:** Implemented memory cleanup, optimized database connection pooling, and API response time improvements (e.g., dashboard API caching).
- **Security:** Authentication flow with proper password hashing and trust proxy settings.
- **Data Integrity:** Database constraints to prevent inconsistent data (e.g., negative inventory).

## External Dependencies
- **PostgreSQL:** Primary database for all ERP data.
- **Redis:** Used for session management.
- **Egyptian Tax Authority (ETA) API:** Integrated for e-invoicing compliance and submission tracking.

## Recent Changes

### PDF Generation Implementation (September 2025)
- **BREAKTHROUGH**: Successfully implemented revolutionary html2canvas-based PDF generation for quotations
- **Approach**: Replaced complex manual jsPDF positioning with simple image capture method
- **Benefits**: 
  - Perfect fidelity between preview and PDF (100% visual consistency)
  - Much simpler maintenance (no manual positioning calculations)
  - Automatic inclusion of all sections (terms & conditions, transportation, packaging)
  - High-quality output with scale: 2 for crisp images
- **Implementation**: Async function captures PrintableQuotation component as PNG, converts to PDF, handles multi-page automatically
- **User Request**: "الله ينور عليك احفظ الطريقة ديه عشان هانحتاجها كتير قدام" - Save this method for frequent future use
- **Code Location**: `client/src/pages/CreateQuotation.tsx` - `generateQuotationPDF` function
- **Libraries Used**: html2canvas + jsPDF with image-based approach instead of text positioning

### Permission System Fixes (September 2025)
- Fixed critical sidebar navigation permission filtering bug where filtering logic was commented out
- Resolved UserPermissionsContext type mismatch - permissions stored as string array but hasPermission function expected objects  
- **COMPLETED**: Fixed race condition issue when opening new tabs/enlarged view where all modules appeared before permissions loaded
- UserPermissionsContext now waits for AuthContext to finish loading before marking permissions as loaded
- Added comprehensive loading state checks to prevent navigation items from showing until permissions are fully loaded
- Successfully tested permission filtering - test_user now only sees Dashboard and Inventory modules as intended in all contexts (original tab, new tabs, enlarged view)

### Customer Data Fetching Fix for Quotation History (September 2025)
- **ISSUE RESOLVED**: Quotation history previews were not showing complete customer data (phone, company, email, address)
- **ROOT CAUSE**: Wrong API endpoint being used - `/api/customers/:id` (returns HTML/404) instead of `/api/v1/customers/:id` (returns complete JSON data)
- **SOLUTION**: Updated QuotationHistory.tsx useQuery to use correct endpoint `/api/v1/customers/${selectedQuotation.customerId}`
- **TECHNICAL APPROACH**: 
  - Modified the customer details fetch query to use proper API v1 endpoint
  - Enhanced customer object passed to PrintableQuotation with all fields (company, phone, email, address, taxNumber, sector, position)
  - Maintained fallback values to prevent undefined data display issues
- **RESULT**: Quotation history previews now show complete customer information identical to Create Quotation preview style
- **USER REQUEST**: "okay rembmer this way to fix" - Documented this approach for future similar API endpoint issues
- **CODE LOCATION**: `client/src/pages/QuotationHistory.tsx` - customer details useQuery hook
- **KEY LEARNING**: Always verify API endpoint paths - v1 routes may differ from base routes, check actual server response before debugging frontend logic