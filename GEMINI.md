# Project Overview

This is a Next.js application for a document classification system. It uses Supabase for the backend, including database and authentication. The application allows users to import, classify, and search for documents within an organizational hierarchy.

The frontend is built with React and Next.js, and the UI components are from Radix UI and custom components. The application is styled with Tailwind CSS.

# Building and Running

To build and run this project, you need to have Node.js and pnpm installed.

1.  **Install dependencies:**

    ```bash
    pnpm install
    ```

2.  **Set up environment variables:**

    Create a `.env.local` file in the root of the project and add the following environment variables:

    ```
    NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
    NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
    ```

3.  **Run the development server:**

    ```bash
    pnpm dev
    ```

    This will start the development server on `http://localhost:3000`.

4.  **Build for production:**

    ```bash
    pnpm build
    ```

    This will create a production build of the application in the `.next` directory.

5.  **Run in production:**

    ```bash
    pnpm start
    ```

    This will start the production server.

# Development Conventions

*   **Linting:** The project uses Next.js's built-in ESLint configuration. To run the linter, use the following command:

    ```bash
    pnpm lint
    ```

*   **Code Style:** The project uses Prettier for code formatting, which is likely integrated with the development environment.
*   **Database:** The project uses Supabase for the database. The database schema is managed through SQL migration files in the `scripts` directory.
*   **Authentication:** The project uses Supabase Authentication. The authentication flow is handled by the `lib/supabase/client.ts` and `lib/supabase/server.ts` files.
