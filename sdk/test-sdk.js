const { AgentLedger } = require('./dist')

const al = new AgentLedger({
  apiKey: process.env.AGENTLEDGER_API_KEY || 'al_live_sk_test_replace_me',
  baseUrl: process.env.AGENTLEDGER_BASE_URL || 'http://localhost:3001/api/v1'
})

async function test() {
  const agent = await al.createAgent({ 
    name: 'SDK Test Agent', 
    modelProvider: 'anthropic', 
    modelId: 'claude-3-sonnet' 
  })
  console.log('✅ Agent created:', agent.id)

  const session = await al.createSession({ agentId: agent.id })
  console.log('✅ Session created:', session.id)

  al.track({ 
    agentId: agent.id, 
    sessionId: session.id,
    category: 'llm_call', 
    level: 'info', 
    message: 'First SDK test event!' 
  })
  
  await al.flush()
  console.log('✅ Event tracked!')
  await al.shutdown()
}

test().catch(console.error)
