import { Suspense } from 'react';
import { LoadingState } from '../../components/states';
import { StaffScreen } from '../../features/staff/staff-screen';

export default function StaffPage() {
  return <Suspense fallback={<LoadingState />}><StaffScreen /></Suspense>;
}
