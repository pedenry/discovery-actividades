import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc } from 'firebase/firestore'

// Initialize Firebase for seeding with real credentials
const firebaseConfig = {
  apiKey: "AIzaSyDqx9S-abvdfz_DIq7n21FMzAFRuQ_4gU",
  authDomain: "discovery-actividades.firebaseapp.com",
  projectId: "discovery-actividades",
  storageBucket: "discovery-actividades.firebasestorage.app",
  messagingSenderId: "421805603915",
  appId: "1:421805603915:web:fccd8329ace8a655621ce"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

console.log('🌐 Connected to Firebase production services')

// Simple createTemplate function for seeding
async function createTemplate(template: any) {
  const docRef = await addDoc(collection(db, 'templates'), template)
  return docRef.id
}

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database...')

    // Create Bar Basic Compliance template
    const templateId = await createTemplate({
      name: 'Bar Basic Compliance',
      items: {
        'item1': {
          id: 'item1',
          name: 'Valid business license',
          type: 'requirement'
        },
        'item2': {
          id: 'item2', 
          name: 'Fire safety certificate',
          type: 'requirement'
        },
        'item3': {
          id: 'item3',
          name: 'Environmental compliance certificate',
          type: 'requirement'
        },
        'item4': {
          id: 'item4',
          name: 'Health permit',
          type: 'requirement'
        },
        'item5': {
          id: 'item5',
          name: 'Waste management plan',
          type: 'request'
        }
      }
    })

    console.log(`✅ Created template: ${templateId}`)

    // Create Workshop template
    const workshopTemplateId = await createTemplate({
      name: 'Workshop Compliance',
      items: {
        'ws1': {
          id: 'ws1',
          name: 'Industrial license',
          type: 'requirement'
        },
        'ws2': {
          id: 'ws2',
          name: 'Safety equipment certification',
          type: 'requirement'
        },
        'ws3': {
          id: 'ws3',
          name: 'Environmental impact assessment',
          type: 'requirement'
        }
      }
    })

    console.log(`✅ Created template: ${workshopTemplateId}`)
    console.log('🎉 Database seeded successfully!')

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

// Run the seed function
seedDatabase()
