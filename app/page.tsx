import { getContentOverrides } from '@/lib/content'
import MeetScribePage from './MeetScribePage'

export default async function Page() {
  const overrides = await getContentOverrides()
  return <MeetScribePage overrides={overrides} />
}
