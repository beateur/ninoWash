/**
 * Script de création d'utilisateur admin
 * Usage: npx tsx scripts/create-admin.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Charger les variables d'environnement depuis .env.local
config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function promoteToAdmin(email: string) {
  console.log(`🔍 Searching for user: ${email}`)
  
  try {
    // 1. List all users and find the target
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Error listing users:', listError.message)
      return
    }

    const user = users.find(u => u.email === email)
    
    if (!user) {
      console.error(`❌ User with email "${email}" not found`)
      console.log('\n📝 Available users:')
      users.slice(0, 5).forEach(u => console.log(`   - ${u.email}`))
      console.log('\n💡 To create this user:')
      console.log(`   1. Go to: http://localhost:3000/auth/signup`)
      console.log(`   2. Sign up with: ${email}`)
      console.log(`   3. Run this script again`)
      return
    }

    console.log(`✅ User found: ${user.id}`)
    console.log(`📧 Email: ${user.email}`)
    console.log(`📅 Created: ${user.created_at}`)
    console.log(`🔐 Current role: ${user.user_metadata?.role || 'none'}`)

    // 2. Update user metadata to add admin role
    console.log('\n🔄 Promoting to admin...')
    
    const { data, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: { 
          ...user.user_metadata,
          role: 'admin' 
        }
      }
    )

    if (updateError) {
      console.error('❌ Error updating user:', updateError.message)
      return
    }

    console.log('\n✅ User successfully promoted to admin!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📧 Email:', data.user.email)
    console.log('🔑 User ID:', data.user.id)
    console.log('👤 Role:', data.user.user_metadata?.role)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n🎯 Next Steps:')
    console.log('   1. Sign in at: http://localhost:3000/auth/signin')
    console.log('   2. Access admin dashboard: http://localhost:3000/admin')
    console.log('   3. Test admin features')
    console.log('\n⚠️  Note: You may need to sign out and sign in again for changes to take effect')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Target email
const targetEmail = 'habilel99@gmail.com'

console.log('🚀 Admin Promotion Script')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

promoteToAdmin(targetEmail)
