'use client';

import { Button, Center, Stack, Text, Title } from '@mantine/core';
import Link from 'next/link';

export default function ForbiddenPage() {
  return <Center mih="100dvh"><Stack align="center"><Title>403</Title><Text>You do not have access to this page.</Text><Button component={Link} href="/">Go home</Button></Stack></Center>;
}
