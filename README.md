# Turisti Email Service

A simple Node.js microservice using Express and Nodemailer to send emails for the Turisti eSIM platform.
This service is designed to be deployed as a standalone application (e.g., on Coolify) and called via an API endpoint from your main Next.js application.

## Features

- Receives email requests via a POST API endpoint (`/send-email`).
- Authenticates requests using a secret API key.
- Sends emails using SMTP configured via environment variables.
- Uses Nodemailer for robust email sending capabilities.

## Prerequisites

- Node.js (v18.x or later recommended)
- An SMTP provider (e.g., Migadu, SendGrid, Mailgun, etc.) and its credentials.

## Setup and Configuration

1.  **Clone the repository (or create the files as listed).**

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env` file in the root of the `turisti-email-service` directory by copying `.env.example`:
    ```bash
    cp .env.example .env
    ```
    Then, edit `.env` with your actual configuration values:

    -   `PORT`: The port the service will run on (default: `3000`).
    -   `API_SECRET_KEY`: A strong, unique secret key that your Next.js application will use to authenticate with this service.
    -   `FROM_EMAIL`: The default "From" address for emails (e.g., `"Turisti eSIM <esim@turisti.al>"`).
    -   `SMTP_HOST`: Your SMTP server hostname.
    -   `SMTP_PORT`: Your SMTP server port (e.g., `587` for TLS/STARTTLS, `465` for SSL).
    -   `SMTP_USER`: Your SMTP username.
    -   `SMTP_PASS`: Your SMTP password.
    -   `SMTP_SECURE`: Set to `true` if using SSL (typically port 465). For STARTTLS (typically port 587), this should be `false` as Nodemailer will upgrade the connection automatically.
    -   `SMTP_REQUIRE_TLS` (optional): Set to `true` to enforce TLS.

    **Note for Coolify Deployment:** You will set these environment variables directly in the Coolify service dashboard instead of using an `.env` file in production.

## Running Locally

-   **For development (with auto-restart on file changes):**
    ```bash
    npm run dev
    ```
-   **For production mode (local):**
    ```bash
    npm start
    ```
The service will be available at `http://localhost:<PORT>`.

## API Endpoint

### `POST /send-email`

Sends an email.

**Request Body (JSON):**

```json
{
  "to": "recipient@example.com",
  "subject": "Your eSIM Details",
  "html": "<h1>Hello!</h1><p>Here are your eSIM details...</p>",
  "text": "Hello! Here are your eSIM details...", // Optional
  "secret": "your_configured_api_secret_key"
}
```

**Responses:**

-   `200 OK`: Email sent successfully.
    ```json
    {
      "success": true,
      "message": "Email sent successfully!",
      "messageId": "<message-id@your-smtp-provider>"
    }
    ```
-   `400 Bad Request`: Missing required fields in the payload.
-   `401 Unauthorized`: Invalid or missing `secret`.
-   `500 Internal Server Error`: Failed to send email due to SMTP error or other server issue.

## Deployment to GitHub and Coolify

1.  **GitHub:**
    *   Create a new private repository on GitHub (e.g., `turisti-email-service`).
    *   Initialize a git repository in your local `turisti-email-service` directory:
        ```bash
        git init
        git add .
        git commit -m "Initial commit for email service"
        ```
    *   Add the GitHub repository as a remote and push:
        ```bash
        git remote add origin https://github.com/your-username/turisti-email-service.git
        git branch -M main
        git push -u origin main
        ```

2.  **Coolify:**
    *   In your Coolify dashboard, add a new **Application** resource.
    *   Connect it to your GitHub repository (`turisti-email-service`).
    *   **Build Pack:** Choose **Nixpacks** (Coolify usually auto-detects Node.js projects well).
    *   **Port:** Set it to the `PORT` you configured (e.g., `3000`).
    *   **Environment Variables:** Add all the necessary environment variables from your `.env.example` (especially `API_SECRET_KEY`, `FROM_EMAIL`, and all `SMTP_*` variables) with their production values. **Do not commit your actual `.env` file with secrets to GitHub.**
    *   **Deploy Command (usually auto-detected):** Should be `npm start` or similar if Nixpacks configures it.
    *   **Install Command (usually auto-detected):** Should be `npm install`.
    *   Deploy the application.
    *   Coolify will provide you with a URL for your deployed service (e.g., `your-email-service.your-coolify-domain.com`).

3.  **Cloudflare Tunnel (Cloudflared) - Optional but Recommended for Public Access:**
    *   If Coolify doesn't automatically provide HTTPS or if you want to use your own domain/subdomain through Cloudflare, you can use a Cloudflare Tunnel.
    *   **Installation on Coolify Server:** You would typically install `cloudflared` on the server where Coolify is running, or if Coolify runs services in containers, you might configure the tunnel to point to the internal IP/port of your deployed email service container.
    *   **Basic Steps for `cloudflared`:**
        1.  [Install `cloudflared`](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/) on the server hosting Coolify or a machine that can reach your Coolify service internally.
        2.  [Login `cloudflared`](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/login/): `cloudflared login`
        3.  [Create a tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/create-tunnel/): `cloudflared tunnel create your-email-tunnel` (note the tunnel ID and JSON credentials file path).
        4.  [Configure the tunnel to route traffic](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/configuration/config-file/) to your email service. Create a `config.yml` (usually in `~/.cloudflared/` or where your tunnel credentials are): 
            ```yaml
            tunnel: your-tunnel-id-from-step-3
            credentials-file: /path/to/your/tunnel-credentials.json 

            ingress:
              - hostname: email-service.turisti.al # Or your desired public hostname
                service: http://localhost:3000 # Or the internal IP/port Coolify exposes your service on
              - service: http_status:404 # Catch-all rule
            ```
        5.  [Route DNS for the hostname](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/routing-to-tunnel/dns/) to the tunnel: `cloudflared tunnel route dns your-email-tunnel email-service.turisti.al`
        6.  [Run the tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/run-tunnel/run-as-service/) (ideally as a service): `cloudflared tunnel run your-email-tunnel`

    *   **Coolify Specifics:** Coolify might have its own integrations or preferred ways to handle custom domains and SSL. Check Coolify's documentation. It might directly integrate with Cloudflare or offer its own reverse proxy setup that simplifies this. If Coolify handles SSL and gives you a public URL, you might not need a separate `cloudflared` setup for basic public access unless you have specific Cloudflare features you want to leverage (like WAF, specific page rules for this endpoint, etc.).

## Modifying Your Next.js App

In your Next.js application (the one deployed on Cloudflare Pages), you will need to update the code that currently calls the `turisti-email-proxy` worker.

Instead, it will make an HTTP POST request to your new email service. For example:

```javascript
// Example in a Next.js API route or server-side function
async function sendPurchaseEmail(emailDetails) {
  const emailServiceUrl = process.env.EMAIL_SERVICE_URL; // e.g., https://email-service.turisti.al/send-email
  const emailServiceSecret = process.env.EMAIL_SERVICE_API_SECRET_KEY;

  try {
    const response = await fetch(emailServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: emailDetails.to,
        subject: emailDetails.subject,
        html: emailDetails.html,
        text: emailDetails.text, // optional
        secret: emailServiceSecret,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to send email via microservice:', response.status, errorData);
      // Handle error appropriately
      throw new Error(errorData.message || 'Email service failed');
    }

    const result = await response.json();
    console.log('Email sent successfully via microservice:', result);
    return result;
  } catch (error) {
    console.error('Error calling email service:', error);
    // Handle error appropriately
    throw error;
  }
}

// Usage:
// await sendPurchaseEmail({
//   to: 'customer@example.com',
//   subject: 'Your eSIM Order',
//   html: '<p>Details...</p>'
// });
```

Remember to set `EMAIL_SERVICE_URL` and `EMAIL_SERVICE_API_SECRET_KEY` as environment variables in your Next.js application deployed on Cloudflare Pages. 