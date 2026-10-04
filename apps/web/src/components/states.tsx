import { Alert, Center, Loader, Stack, Text } from '@mantine/core';

export function LoadingState() { return <Center py="xl"><Loader aria-label="Loading" /></Center>; }
export function EmptyState({ message = 'Nothing to show yet.' }: { message?: string }) {
  return <Center py="xl"><Text c="dimmed">{message}</Text></Center>;
}
export function ErrorState({ message = 'Could not load this page.', retry }: { message?: string; retry?: () => void }) {
  return <Stack py="xl"><Alert color="red" title="Error">{message}</Alert>{retry && <button onClick={retry}>Try again</button>}</Stack>;
}
