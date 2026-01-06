import { redirect } from 'next/navigation'

const DEMO_BRAND_ID = 'a0295b8d-c0f9-49db-b839-8a6021d3ecf7'

export default function DemoPage() {
  redirect(`/${DEMO_BRAND_ID}/templates`)
}
