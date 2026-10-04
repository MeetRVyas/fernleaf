'use client';

import { login } from '@fernleaf/shared';
import { Button, Center, Paper, PasswordInput, Stack, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { zod4Resolver } from 'mantine-form-zod-resolver';
import { useRouter } from 'next/navigation';
import { useLogin } from '../../lib/auth';
import { showApiError } from '../../lib/errors';
import { loginAndRedirect } from '../../lib/login-flow';

export function LoginScreen() {
  const router = useRouter();
  const mutation = useLogin();
  const form = useForm({ initialValues: { email: '', password: '' }, validate: zod4Resolver(login.body) });
  return <Center mih="100dvh" p="md"><Paper shadow="sm" p="xl" radius="md" withBorder w="100%" maw={400}>
    <form onSubmit={form.onSubmit(values => {
      void loginAndRedirect(values, path => router.replace(path), mutation.mutateAsync)
        .catch(error => showApiError(error, form.setFieldError));
    })}>
      <Stack><Title order={2}>Sign in</Title>
        <TextInput label="Email" type="email" autoComplete="username" required {...form.getInputProps('email')} />
        <PasswordInput label="Password" autoComplete="current-password" required {...form.getInputProps('password')} />
        <Button type="submit" loading={mutation.isPending}>Sign in</Button>
      </Stack>
    </form>
  </Paper></Center>;
}
