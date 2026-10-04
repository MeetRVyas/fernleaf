'use client';

import { Button, Center, Stack, Text, Title } from '@mantine/core';
import Link from 'next/link';

export default function NotFound() {
  return <Center mih="100dvh"><Stack align="center"><Title>404</Title><Text>Page not found.</Text><Button component={Link} href="/">Go home</Button></Stack></Center>;
}
