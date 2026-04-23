# AI Financial Advisor Setup Guide

Complete guide to set up OpenAI API for AI-powered financial insights.

## What's the AI Advisor?

The AI Advisor uses ChatGPT to:
- Analyze your spending patterns
- Suggest ways to save money
- Warn about overspending
- Provide personalized financial advice
- Answer financial questions

Example conversation:
```
User: "Why is my spending so high this month?"
AI: "Your entertainment category increased 45% from last month.
    Consider reducing streaming subscriptions and dining out.
    You could save $150/month if you reduce these by 50%."
```

---

## Step 1: Create OpenAI Account

1. Go to [platform.openai.com](https://platform.openai.com)
2. Click **"Sign up"** or **"Log in"**
3. Create account (GitHub, Google, or email)
4. Verify email
5. Provide payment method (required for usage)

## Step 2: Get API Key

1. In OpenAI dashboard, click **"API keys"** (left sidebar)
2. Click **"Create new secret key"**
3. Name it: `smart-budget-tracker`
4. Click **"Create secret key"**
5. **COPY THE KEY** (you won't see it again!)
6. Store safely: `sk-...` 

**⚠️ SECURITY**: Never commit API key to GitHub!

## Step 3: Set Billing & Limits

### Set Up Billing

1. Go to **Billing** → **Overview**
2. Click **"Set up paid account"**
3. Add payment method (credit card)
4. Enable billing

### Set Usage Limits (Important!)

1. Go to **Billing** → **Usage limits**
2. Set **Hard limit**: $10 (prevents overspending)
3. Set **Soft limit**: $5 (warning at this amount)

### Check Pricing

- **GPT-4**: $0.03-0.06 per 1K tokens
- **GPT-3.5-turbo**: $0.0005-0.0015 per 1K tokens (cheaper!)
- **Embeddings**: $0.0001 per 1K tokens

For this app, **GPT-3.5-turbo is perfect** (cheap + fast)

## Step 4: Add API Key to Project

### Create `.env.local` in frontend folder

```bash
cd frontend
cat > .env.local << EOF
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_OPENAI_API_KEY=sk-your-api-key
EOF
```

**Important**: Add `.env.local` to `.gitignore`
```
echo ".env.local" >> .gitignore
```

### For Railway Deployment

1. Go to Railway project **Variables**
2. Add new variable:
   ```
   VITE_OPENAI_API_KEY = sk-...
   ```
3. Click **"Deploy"**

## Step 5: Create AI Advisor Component

Create `src/components/AIAdvisor.jsx`:

```jsx
import React, { useState, useRef, useEffect } from 'react';
import { useBudget } from '../context/BudgetContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export const AIAdvisor = () => {
  const { user } = useAuth();
  const { expenses, accounts, calculateTotals } = useBudget();
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: 'Hello! I\'m your AI Financial Advisor. I can analyze your spending, suggest savings, and answer financial questions. What would you like to know?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError(null);

    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      // Prepare financial summary for AI
      const totals = calculateTotals();
      const recentExpenses = expenses.slice(0, 10);

      const systemPrompt = `You are a helpful financial advisor. The user has shared their financial data with you.

Current Financial Summary:
- Checking Account: $${totals.checking.toFixed(2)}
- Savings Account: $${totals.savings.toFixed(2)}
- Total Debt: $${totals.debt.toFixed(2)}
- Monthly Spending: $${totals.monthlySpending.toFixed(2)}

Recent Expenses:
${recentExpenses.map((e) => `- $${e.amount.toFixed(2)} (${new Date(e.expense_date).toLocaleDateString()})`).join('\n')}

Be conversational, helpful, and provide actionable advice. Keep responses concise (under 150 words).`;

      // Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
              .filter((m) => m.id !== userMessage.id || m.role !== 'user')
              .map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: input },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API Error');
      }

      const data = await response.json();
      const aiMessage = data.choices[0].message.content;

      // Add AI response
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: aiMessage,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Save conversation to Supabase (optional)
      await supabase.from('ai_conversations').insert([
        {
          user_id: user.id,
          message: input,
          response: aiMessage,
          conversation_type: 'general',
        },
      ]).catch(() => {
        // Silently fail if can't save (Supabase not critical for chat)
      });
    } catch (err) {
      setError(err.message);
      console.error('AI Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900">AI Financial Advisor 🤖</h1>
        <p className="text-slate-600 mt-2">Chat with AI to get personalized financial advice</p>
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-xl shadow-lg flex flex-col h-[600px]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-400 text-white rounded-br-none'
                    : 'bg-slate-100 text-slate-900 rounded-bl-none'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 px-4 py-3 rounded-lg rounded-bl-none">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="border-t border-slate-200 p-4 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your finances..."
            disabled={loading}
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-blue-400 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition"
          >
            Send
          </button>
        </form>
      </div>

      {/* Suggested Questions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-4">Suggested Questions:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            'Analyze my spending patterns',
            'How can I save more money?',
            'What\'s my largest expense category?',
            'Should I adjust my budget?',
          ].map((question) => (
            <button
              key={question}
              onClick={() => {
                setInput(question);
                setTimeout(() => {
                  document.querySelector('form')?.dispatchEvent(
                    new Event('submit', { bubbles: true })
                  );
                }, 0);
              }}
              className="text-left px-4 py-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition text-blue-900 text-sm font-medium"
            >
              {question}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
```

## Step 6: Add AI Advisor to Navigation

Edit `src/components/Navigation.jsx`:

```jsx
const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/expenses', label: 'Expenses', icon: '💰' },
  { path: '/accounts', label: 'Accounts', icon: '🏦' },
  { path: '/budget', label: 'Budget', icon: '📈' },
  { path: '/reports', label: 'Reports', icon: '📋' },
  { path: '/ai-advisor', label: 'AI Advisor', icon: '🤖' }, // Add this
];
```

## Step 7: Add Route to App

Edit `src/App.jsx`:

```jsx
import { AIAdvisor } from './components/AIAdvisor';

// Add this route:
<Route
  path="/ai-advisor"
  element={
    <ProtectedRoute>
      <AppLayout>
        <AIAdvisor />
      </AppLayout>
    </ProtectedRoute>
  }
/>
```

## Step 8: Test Locally

```bash
cd frontend
npm run dev
```

1. Visit http://localhost:5173
2. Log in
3. Click "AI Advisor" (🤖)
4. Ask a question!

If it doesn't work:
- Check `.env.local` has correct API key
- Check browser console for errors
- Verify OpenAI account has billing enabled

## Step 9: Monitor API Usage

### In OpenAI Dashboard

1. Go to **Usage**
2. See:
   - Total spent this month
   - Requests per day
   - Tokens used
3. Set limits in **Billing** to prevent overspend

### Example Costs
- 100 conversations: ~$0.50
- 1,000 conversations: ~$5.00
- With hard limit of $10: Safe for experiments

## Step 10: Advanced Features (Optional)

### Save Conversation History

```jsx
// In AIAdvisor.jsx, after getting response
await supabase.from('ai_conversations').insert([
  {
    user_id: user.id,
    message: input,
    response: aiMessage,
    tokens_used: data.usage.total_tokens,
    conversation_type: 'spending_analysis',
  },
]);
```

### Load Previous Conversations

```jsx
const fetchConversationHistory = async () => {
  const { data } = await supabase
    .from('ai_conversations')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  // Display in sidebar or separate tab
};
```

### Add More AI Features

```jsx
// Financial Analysis Endpoint
const analyzeSpending = async () => {
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "You are a financial analyst. Analyze this spending data and provide insights."
      },
      {
        role: "user",
        content: `Analyze: ${JSON.stringify(expenses)}`
      }
    ]
  });
  return response.data.choices[0].message.content;
};
```

## Troubleshooting

### Issue: "Invalid API Key"

**Solution**:
1. Verify key starts with `sk-`
2. Check for extra spaces in `.env.local`
3. Get fresh key from OpenAI dashboard
4. Restart dev server

### Issue: "Rate limit exceeded"

**Solution**:
1. Wait 1 minute (rate limit resets)
2. Upgrade OpenAI account to higher tier
3. Implement request queuing

### Issue: "Insufficient balance"

**Solution**:
1. Add payment method to OpenAI
2. Set billing to active
3. Wait for account to be approved

### Issue: "API returns empty response"

**Solution**:
1. Check OpenAI status page
2. Verify request format is correct
3. Increase `max_tokens` in request

## Best Practices

### 1. Cache Responses
```jsx
const cache = new Map();

const getAIResponse = async (query) => {
  if (cache.has(query)) return cache.get(query);
  const response = await callAPI(query);
  cache.set(query, response);
  return response;
};
```

### 2. Rate Limit Requests
```jsx
const makeRequest = async (query) => {
  await delay(1000); // 1 second between requests
  return callAPI(query);
};
```

### 3. Use Cheaper Model
```jsx
// Use gpt-3.5-turbo instead of gpt-4
model: "gpt-3.5-turbo" // 10x cheaper!
```

### 4. Shorter Responses
```jsx
max_tokens: 300, // Shorter = cheaper
```

### 5. Monitor Spending
- Check OpenAI Usage daily
- Set alerts if approaching limit
- Review expensive queries

## Security

### Never Expose API Key

```jsx
// ❌ WRONG - Don't do this!
const response = await fetch('...', {
  headers: {
    'Authorization': `Bearer sk-actual-key` // Exposed!
  }
});

// ✅ RIGHT - Use environment variable
const response = await fetch('...', {
  headers: {
    'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
  }
});
```

### Validate Inputs
```jsx
if (!input || input.length > 1000) {
  setError('Message too long');
  return;
}
```

### Rate Limit Per User
```jsx
// Prevent abuse
const MESSAGES_PER_HOUR = 50;
```

## Cost Optimization Tips

1. **Use GPT-3.5-turbo**: 10x cheaper than GPT-4
2. **Shorter max_tokens**: Only ask for needed length
3. **Cache responses**: Don't repeat same query
4. **Batch requests**: Send multiple at once
5. **Use embeddings**: Cheaper than full completions

## Next Steps

1. ✅ OpenAI account created
2. ✅ API key configured
3. ✅ AI Advisor component built
4. → [Test in production](./DEPLOY_RAILWAY.md)
5. → [Add more AI features](./ADVANCED.md)

## Useful Links

- [OpenAI API Docs](https://platform.openai.com/docs/api-reference)
- [Pricing Calculator](https://platform.openai.com/account/billing/overview)
- [API Status](https://status.openai.com)
- [Best Practices](https://platform.openai.com/docs/guides/safety-best-practices)

---

**Your AI Financial Advisor is ready!** 🤖💰

Now when you ask questions like:
- "Why is my spending so high?"
- "How can I save money?"
- "Should I adjust my budget?"

The AI will analyze your real financial data and give personalized advice!
