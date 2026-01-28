'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Mail, Loader2, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/lib/api';

// Validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      setError('');

      await auth.forgotPassword(data.email);

      setEmailSent(data.email);
      setIsSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        'Failed to send reset link. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-2xl dark:bg-gray-900/50 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <AnimatePresence mode="wait">
              {!isSuccess ? (
                <motion.div
                  key="forgot-password"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                    <KeyRound className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    Forgot Password?
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    No worries, we&apos;ll send you reset instructions
                  </CardDescription>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Check Your Email
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    We&apos;ve sent password reset instructions
                  </CardDescription>
                </motion.div>
              )}
            </AnimatePresence>
          </CardHeader>

          <CardContent className="space-y-4">
            <AnimatePresence mode="wait">
              {!isSuccess ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm"
                    >
                      {error}
                    </motion.div>
                  )}

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="john.doe@example.com"
                          className="pl-10"
                          error={!!errors.email}
                          {...register('email')}
                          autoFocus
                        />
                      </div>
                      {errors.email && (
                        <p className="text-sm text-red-500">{errors.email.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Reset Link'
                      )}
                    </Button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="success-message"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-800 dark:text-green-300 text-center">
                      We sent a password reset link to{' '}
                      <span className="font-semibold">{emailSent}</span>
                    </p>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground text-center">
                    <p>
                      Click the link in your email to reset your password. If you don&apos;t see it,
                      check your spam folder.
                    </p>
                  </div>

                  <Button
                    onClick={() => {
                      setIsSuccess(false);
                      setEmailSent('');
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Send to different email
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>

          <CardFooter>
            <Link
              href="/auth/login"
              className="flex items-center justify-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors w-full"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </CardFooter>
        </Card>

        {/* Additional help section */}
        {!isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-6 text-center"
          >
            <p className="text-sm text-muted-foreground">
              Need help?{' '}
              <Link
                href="/support"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                Contact Support
              </Link>
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
