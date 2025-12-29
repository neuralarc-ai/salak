// Dummy user data for testing
export interface User {
  id: string
  email: string
  password: string
  name: string
  role: "user" | "admin"
  avatar?: string
}

export const dummyUsers: User[] = [
  {
    id: "1",
    email: "admin@salak.com",
    password: "admin123",
    name: "Admin User",
    role: "admin",
  },
  {
    id: "2",
    email: "john@salak.com",
    password: "password123",
    name: "John Doe",
    role: "user",
  },
  {
    id: "3",
    email: "jane@salak.com",
    password: "password123",
    name: "Jane Smith",
    role: "user",
  },
  {
    id: "4",
    email: "bob@salak.com",
    password: "password123",
    name: "Bob Johnson",
    role: "user",
  },
]

// Helper function to authenticate user
export function authenticateUser(
  email: string,
  password: string
): User | null {
  const user = dummyUsers.find(
    (u) => u.email === email && u.password === password
  )
  return user || null
}

// Helper function to get user by email
export function getUserByEmail(email: string): User | undefined {
  return dummyUsers.find((u) => u.email === email)
}

