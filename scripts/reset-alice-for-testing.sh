#!/bin/bash
# Reset Alice Baker for clean Stripe sandbox testing

echo "🧹 Resetting Alice Baker for clean testing..."
echo ""

# Delete subscription
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "
DELETE FROM user_subscriptions 
WHERE user_id = 'b5a39943-724b-4dc9-b2d8-006afae23eb9';
" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "✅ Alice's subscription deleted from database"
else
  echo "⚠️  Warning: Could not delete subscription (may not exist)"
fi

echo ""
echo "📋 Next steps for clean testing:"
echo ""
echo "1. 🧹 Clear browser cache:"
echo "   - Open DevTools (F12)"
echo "   - Application → Clear storage → Clear site data"
echo "   - Or run in console: localStorage.clear(); sessionStorage.clear(); location.reload(true);"
echo ""
echo "2. 🔐 Login as Alice:"
echo "   - URL: http://localhost:5174/auth/signin"
echo "   - Email: alice@example.com"
echo "   - Password: password123"
echo ""
echo "3. 💳 Go through Stripe checkout:"
echo "   - Navigate to: /subscription"
echo "   - Click: 'Start Free Trial'"
echo "   - Use test card: 4242 4242 4242 4242"
echo "   - Exp: 12/34, CVC: 123, ZIP: 12345"
echo ""
echo "4. ⏱️  Wait for webhook (~5-10 seconds)"
echo ""
echo "5. ✅ Test Customer Portal:"
echo "   - Go to: /subscription"
echo "   - Click: 'Manage Subscription'"
echo "   - Should open Stripe portal successfully!"
echo ""
echo "🎉 Alice is ready for testing!"
