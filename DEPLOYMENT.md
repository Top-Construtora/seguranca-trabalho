# Deployment Guide

## Environment Variables

### Backend (Render.com)
Configure estas variáveis de ambiente no dashboard do Render:

```
DATABASE_URL=postgresql://postgres.cbqguwejkuxjrqmemypn:rf9vMiLTnyMpHEqe@aws-0-us-east-2.pooler.supabase.com:6543/postgres
PORT=3333
NODE_ENV=production
JWT_SECRET=wmkfi3BEf24jNv/33NHxRPaWpbpEHpWCW/ngwYqzArmPXsOzW9WiuFMB2Y42YzQA5hO89fbtj561n8DEsp8Hyw==
JWT_EXPIRES_IN=7d
SUPABASE_URL=https://cbqguwejkuxjrqmemypn.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNicWd1d2Vqa3V4anJxbWVteXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyOTEwMzEsImV4cCI6MjA2ODg2NzAzMX0.mSfD2GbWilyzTbCCSTc1OQm3keGqDsAbuaJyknH0Xbc
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNicWd1d2Vqa3V4anJxbWVteXBuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzI5MTAzMSwiZXhwIjoyMDY4ODY3MDMxfQ.fkO1k8a_30Tq_LOlnzqTZba72wl5cnAbA26wRpjC0BM
FRONTEND_URL=https://seguranca-trabalho.vercel.app
```

### Frontend (Vercel)
Configure estas variáveis de ambiente no dashboard da Vercel:

```
VITE_API_URL=https://seguranca-trabalho.onrender.com
VITE_SUPABASE_URL=https://cbqguwejkuxjrqmemypn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNicWd1d2Vqa3V4anJxbWVteXBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyOTEwMzEsImV4cCI6MjA2ODg2NzAzMX0.mSfD2GbWilyzTbCCSTc1OQm3keGqDsAbuaJyknH0Xbc
```

## Issues Fixed

✅ **CORS Configuration**: Backend now accepts requests from Vercel domain
✅ **API Routes**: All routes now have `/api` prefix
✅ **TypeScript Errors**: Fixed compilation errors in auth middleware
✅ **Entity References**: Updated to use correct User entity
✅ **Production Environment**: Ready for deployment

## Deployment Steps

1. **Push to repository**: `git push origin main`
2. **Configure Environment Variables**: Set the variables above in Render and Vercel dashboards
3. **Deploy Backend**: Render will auto-deploy from the main branch
4. **Deploy Frontend**: Vercel will auto-deploy from the main branch
5. **Test**: Access the frontend URL and try to login

The authentication system should now work correctly in production!