# Stripe MCP Server - Setup Complete

## ✅ Installation Complete

The Stripe Model Context Protocol (MCP) server has been successfully installed in Cursor!

**Configuration File:** `~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "stripe": {
      "url": "https://mcp.stripe.com"
    }
  }
}
```

---

## 🤖 What This Enables

The Stripe MCP server allows AI agents (like Claude in Cursor) to interact directly with the Stripe API and search Stripe's knowledge base. This means you can:

### **1. Natural Language Stripe Operations**

Ask AI to perform Stripe operations in plain English:

- "Create a new customer named John Doe with email john@example.com"
- "List all subscriptions that are currently active"
- "Create a payment link for the Premium product"

### **2. Search Stripe Documentation**

Ask questions about Stripe:

- "How do I handle failed payments?"
- "What's the difference between PaymentIntent and Charge?"
- "Show me how to set up webhooks"

### **3. Inspect Your Stripe Data**

Query your Stripe account:

- "Show me my recent invoices"
- "List all customers who signed up this month"
- "Check my account balance"

---

## 🔐 Authorization

The Stripe MCP uses **OAuth** for secure authorization:

1. **First Use:** When you first use Stripe MCP tools in Cursor, you'll see an OAuth consent form
2. **Admin Required:** You must be a Stripe admin to authorize the connection
3. **Granular Permissions:** OAuth provides more security than API keys with specific scopes

### Managing OAuth Sessions

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Settings** → **Apps** → **Stripe MCP**
3. View **Client sessions** to see active connections
4. **Revoke session** to disconnect a specific client

---

## 🛠️ Available Tools

The Stripe MCP server provides these tools (according to the [Stripe MCP documentation](https://docs.stripe.com/mcp?mcp-client=cursor)):

### **Account**

- `get_stripe_account_info` - Retrieve account details

### **Balance**

- `retrieve_balance` - Get account balance

### **Customers**

- `create_customer` - Create a new customer
- `list_customers` - List all customers

### **Subscriptions**

- `list_subscriptions` - List subscriptions
- `update_subscription` - Update subscription details
- `cancel_subscription` - Cancel a subscription

### **Products & Pricing**

- `create_product` - Create a product
- `list_products` - List products
- `create_price` - Create a price
- `list_prices` - List prices

### **Invoices**

- `create_invoice` - Create an invoice
- `create_invoice_item` - Add item to invoice
- `finalize_invoice` - Finalize draft invoice
- `list_invoices` - List invoices

### **Payment Links**

- `create_payment_link` - Create a payment link

### **PaymentIntents**

- `list_payment_intents` - List payment intents

### **Refunds**

- `create_refund` - Create a refund

### **Coupons**

- `create_coupon` - Create a coupon
- `list_coupons` - List coupons

### **Disputes**

- `list_disputes` - List disputes
- `update_dispute` - Update dispute

### **General**

- `search_stripe_resources` - Search across Stripe objects
- `fetch_stripe_resources` - Fetch specific Stripe object
- `search_stripe_documentation` - Search Stripe knowledge base

---

## 💡 Usage Examples

### Example 1: Create a Customer for Alice

```
"Create a Stripe customer for Alice Baker with email alice@example.com"
```

The MCP will use `create_customer` tool to create the customer.

### Example 2: Check Recent Subscriptions

```
"Show me all subscriptions created in the last 7 days"
```

The MCP will use `list_subscriptions` with date filters.

### Example 3: Search Documentation

```
"How do I handle subscription trials in Stripe?"
```

The MCP will use `search_stripe_documentation` to find relevant guides.

### Example 4: Check Account Balance

```
"What's my current Stripe balance?"
```

The MCP will use `retrieve_balance` to get account balance.

### Example 5: Create Payment Link

```
"Create a payment link for the Premium subscription product"
```

The MCP will use `create_payment_link` with your product details.

---

## 🔒 Security Best Practices

### Enable Human Confirmation

According to the documentation:

> We recommend enabling human confirmation of tools and exercising caution when using the Stripe MCP with other servers to avoid prompt injection attacks.

**How to enable in Cursor:**

1. Go to Cursor Settings
2. Enable "Require confirmation for sensitive operations"
3. Review all Stripe operations before they execute

### Be Cautious with Multiple MCPs

When using Stripe MCP alongside other MCP servers (like Supabase, Vercel), be aware of:

- **Prompt injection risks** - One MCP could potentially influence another
- **Review all operations** - Always review before executing

### Use Restricted Keys for Autonomous Agents

If building autonomous agents that use Stripe MCP:

- Use **restricted API keys** instead of OAuth
- Limit permissions to only what's needed
- Pass as bearer token: `Authorization: Bearer sk_test_...`

---

## 🧪 Testing the Integration

### Test 1: Verify Connection

In Cursor, ask:

```
"Can you check my Stripe account information?"
```

Expected: OAuth prompt (first time) → Account details displayed

### Test 2: Search Documentation

```
"Search Stripe docs for information about webhooks"
```

Expected: Relevant documentation snippets

### Test 3: List Resources

```
"List my Stripe customers"
```

Expected: List of customers from your account

### Test 4: Check with Alice Baker

```
"Find the Stripe customer record for alice@example.com"
```

Expected: Should find Alice if she has a Stripe customer record

---

## 🔄 Next Steps

Now that Stripe MCP is installed, you can:

1. **Test Basic Operations**
   - Ask AI to retrieve your Stripe account info
   - List customers and subscriptions
   - Search documentation

2. **Integrate with Alice's Testing**
   - "Check if Alice Baker (alice@example.com) exists as a Stripe customer"
   - "Create a subscription for Alice's customer ID"
   - "List all invoices for Alice"

3. **Use for Development**
   - Ask questions about Stripe implementation
   - Get code examples from documentation
   - Debug webhook issues

4. **Monitor Your Data**
   - Check subscription statuses
   - View recent payments
   - Inspect failed charges

---

## 📚 Related Resources

- [Stripe MCP Documentation](https://docs.stripe.com/mcp?mcp-client=cursor) - Official guide
- [Model Context Protocol Spec](https://modelcontextprotocol.io) - MCP standard
- [Cursor MCP Guide](https://docs.cursor.com) - Cursor-specific docs
- [Stripe API Reference](https://stripe.com/docs/api) - Full API docs

---

## 🐛 Troubleshooting

### Issue: OAuth Not Prompting

**Solution:** Restart Cursor to reload MCP configuration

```bash
# Force Cursor to reload
killall Cursor && open -a Cursor
```

### Issue: "Not Authorized" Errors

**Solution:**

1. Check you're logged into the correct Stripe account
2. Verify you have admin permissions
3. Re-authorize in Stripe Dashboard → Settings → Apps

### Issue: Can't Find Specific Customer

**Solution:** Use search tool:

```
"Search Stripe for customer with email alice@example.com"
```

### Issue: Rate Limits

**Solution:** Stripe MCP respects API rate limits. Wait a moment between operations.

---

## ✅ Installation Checklist

- [x] Added Stripe MCP to `~/.cursor/mcp.json`
- [x] Configuration verified (valid JSON)
- [x] Preserved existing MCP servers (Supabase, Vercel, Playwright)
- [x] Documentation created

**Next:** Restart Cursor and test the OAuth connection!

---

## 🎉 You're All Set!

The Stripe MCP server is now available in Cursor. Try asking:

```
"Show me my Stripe account details"
```

or

```
"Help me understand how Stripe subscriptions work"
```

Happy coding with AI-powered Stripe integration! 🚀
