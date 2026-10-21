import { Redirect } from 'expo-router';

export default function AdminIndex() {
  return <Redirect href={{ pathname: '/admin/[view]', params: { view: 'queue' } }} />;
}
