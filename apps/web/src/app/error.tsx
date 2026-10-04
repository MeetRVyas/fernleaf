'use client';

import { Button, Center, Stack, Text, Title } from '@mantine/core';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <Center mih="100dvh"><Stack align="center"><Title>Something went wrong</Title><Text>Please try again.</Text><Button onClick={reset}>Try again</Button></Stack></Center>;
}
