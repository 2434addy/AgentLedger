const { AgentLedger } = require('./dist')

const al = new AgentLedger({ 
  apiKey: 'al_live_sk_5c9c36ecd94529eebc1a889046d3671db647bd4d7abce406d018dfe0507ca966',
  baseUrl: 'http://localhost:3001/api/v1'
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
