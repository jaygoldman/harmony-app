# Azure AD Authentication Setup

This guide walks you through setting up Microsoft Entra ID (Azure AD) authentication for the Harmony app.

## Prerequisites

- Azure subscription with access to Azure Active Directory
- Admin permissions to create app registrations

## Step 1: Create an App Registration in Azure AD

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill in the details:
   - **Name**: `Harmony App` (or your preferred name)
   - **Supported account types**: Select based on your needs:
     - **Single tenant**: Only your organization
     - **Multi-tenant**: Any Azure AD directory
   - **Redirect URI**: 
     - Type: `Single-page application (SPA)`
     - URL: `http://localhost:3000` (for development)
     - For production, use your actual domain: `https://yourdomain.com`

## Step 2: Configure App Registration

After creating the app registration:

1. **Note down the Application (client) ID** - you'll need this for configuration
2. **Note down the Directory (tenant) ID** from the Overview page
3. Go to **Authentication** tab:
   - Ensure `Access tokens` and `ID tokens` are checked under "Implicit grant and hybrid flows"
   - Add additional redirect URIs if needed (e.g., production URLs)
4. Go to **API permissions** tab:
   - The app should already have `User.Read` permission for Microsoft Graph
   - If not, click **Add a permission** > **Microsoft Graph** > **Delegated permissions** > **User.Read**

## Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your Azure AD values:
   ```env
   REACT_APP_AZURE_TENANT_ID=your-tenant-id-here
   REACT_APP_AZURE_CLIENT_ID=your-client-id-here
   REACT_APP_AZURE_REDIRECT_URI=http://localhost:3000
   REACT_APP_AZURE_AUTHORITY=https://login.microsoftonline.com/your-tenant-id-here
   ```

   **Where to find these values:**
   - **REACT_APP_AZURE_TENANT_ID**: Azure Portal > Azure Active Directory > Overview > Directory (tenant) ID
   - **REACT_APP_AZURE_CLIENT_ID**: Azure Portal > Azure Active Directory > App registrations > Your app > Overview > Application (client) ID
   - **REACT_APP_AZURE_REDIRECT_URI**: Should match what you configured in the app registration
   - **REACT_APP_AZURE_AUTHORITY**: Replace `your-tenant-id-here` with your actual tenant ID

## Step 4: Test the Authentication

1. Start the development server:
   ```bash
   npm start
   ```

2. Navigate to `http://localhost:3000`
3. You should see the login screen
4. Click "Sign in with Microsoft" and authenticate with your Microsoft account
5. After successful authentication, you should see the main Harmony dashboard

## Step 5: Deploy to Azure (Production)

When deploying to Azure App Service or Static Web Apps:

1. **Update App Registration**:
   - Add your production domain to the redirect URIs
   - Example: `https://harmony-app.azurestaticapps.net`

2. **Update Environment Variables**:
   - Set the production environment variables in your Azure service
   - Update `REACT_APP_AZURE_REDIRECT_URI` to your production URL

3. **Configure Azure Static Web Apps** (if using):
   - Add the environment variables in the Azure portal under Configuration
   - The build will automatically use these variables

## Troubleshooting

### Common Issues:

1. **CORS Errors**: 
   - Ensure your redirect URI exactly matches what's configured in Azure AD
   - Check that you're using the correct URI scheme (http vs https)

2. **Authentication Fails**:
   - Verify tenant ID and client ID are correct
   - Ensure the user has access to the application
   - Check browser console for detailed error messages

3. **Token Issues**:
   - Ensure `User.Read` permission is granted
   - Check that access tokens are enabled in the app registration

### Useful Azure AD Endpoints:

- **Authority**: `https://login.microsoftonline.com/{tenant-id}`
- **Common Authority** (multi-tenant): `https://login.microsoftonline.com/common`
- **Graph API**: `https://graph.microsoft.com/v1.0/me`

## Security Considerations

- Never commit your `.env` file to version control (it's already in `.gitignore`)
- Use different app registrations for development and production
- Regularly rotate client secrets if you're using them (though this SPA setup uses PKCE flow)
- Consider implementing role-based access control if needed
- Monitor authentication logs in Azure AD for suspicious activity

## Additional Resources

- [Microsoft Authentication Library (MSAL) for React](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-react)
- [Azure AD App Registration Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [Single-Page Application Authentication Flow](https://docs.microsoft.com/en-us/azure/active-directory/develop/scenario-spa-overview)