'use client';

import { can } from '@fernleaf/shared';
import { AppShell, Burger, Button, Group, NavLink, Stack, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useLogout, useSession } from '../lib/auth';
import { landingPath } from '../lib/landing';
import { featureNavigation } from '../lib/nav';
import { ErrorState, LoadingState } from './states';

export function ProtectedShell({ children }: { children: ReactNode }) {
  const session = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const logout = useLogout();
  const [opened, { toggle, close }] = useDisclosure();

  if (session.isPending) return <LoadingState />;
  if (session.isError) {
    if ((session.error as { code?: string }).code === 'UNAUTHENTICATED') {
      router.replace('/login');
      return <LoadingState />;
    }
    return <ErrorState retry={() => { void session.refetch(); }} />;
  }
  const user = session.data;
  const home = landingPath(user);
  const links = featureNavigation.filter(item => can(user, item.permission));
  return (
    <AppShell header={{ height: 60 }} navbar={{ width: 250, breakpoint: 'sm', collapsed: { mobile: !opened } }} padding="md">
      <AppShell.Header><Group h="100%" px="md" justify="space-between">
        <Group><Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" /><Title order={3}>Fernleaf Kitchen</Title></Group>
        <Group gap="sm"><Text size="sm" visibleFrom="sm">{user.name}</Text><Button variant="subtle" size="sm" onClick={() => logout.mutate(undefined, { onSuccess: () => router.replace('/login') })}>Sign out</Button></Group>
      </Group></AppShell.Header>
      <AppShell.Navbar p="sm"><Stack gap="xs">
        <NavLink component={Link} href={home} label="Home" active={pathname === home} onClick={close} />
        {links.map(item => <NavLink key={item.path} component={Link} href={item.path} label={item.label} active={pathname === item.path} onClick={close} />)}
      </Stack></AppShell.Navbar>
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}

export function RoleLanding({ path, title }: { path: string; title: string }) {
  const session = useSession();
  const router = useRouter();
  if (session.isPending) return <LoadingState />;
  if (session.isError) return <ErrorState retry={() => { void session.refetch(); }} />;
  if (landingPath(session.data) !== path) {
    router.replace('/403');
    return <LoadingState />;
  }
  return <ProtectedShell><Title order={2}>{title}</Title><Text c="dimmed" mt="sm">Dashboard coming with this feature.</Text></ProtectedShell>;
}
