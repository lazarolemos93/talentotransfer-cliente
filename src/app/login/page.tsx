'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  // Redirigir si el usuario ya está autenticado
  useEffect(() => {
    console.log('Auth state changed:', user);
    if (user) {
      console.log('User authenticated, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    if (!email || !password) {
      setError('Por favor, introduce email y contraseña');
      setLoading(false);
      return;
    }

    try {
      console.log('Intentando iniciar sesión...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Usuario autenticado:', userCredential.user.email);
      // No es necesario hacer nada más aquí, el AuthContext se encargará de la redirección
    } catch (err: any) {
      console.error('Error completo:', err);
      if (err.code === 'auth/invalid-email') {
        setError('El formato del email no es válido');
      } else if (err.code === 'auth/user-not-found') {
        setError('No existe una cuenta con este email');
      } else if (err.code === 'auth/wrong-password') {
        setError('Contraseña incorrecta');
      } else {
        setError(`Error al iniciar sesión: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, ingresa tu correo electrónico para recuperar tu contraseña.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage('Se ha enviado un correo de recuperación. Por favor, revisa tu bandeja de entrada.');
      setIsRecovering(false);
    } catch (err) {
      setError('Error al enviar el correo de recuperación. Verifica que el correo sea correcto.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isRecovering ? 'Recuperar Contraseña' : 'Iniciar Sesión'}
          </CardTitle>
          <CardDescription className="text-center">
            {isRecovering 
              ? 'Ingresa tu correo electrónico para recuperar tu contraseña'
              : 'Ingresa tus credenciales para acceder al dashboard'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {successMessage && (
            <Alert className="mb-6">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={isRecovering ? handlePasswordRecovery : handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            {!isRecovering && (
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cargando...
                </>
              ) : (
                isRecovering ? 'Enviar correo de recuperación' : 'Iniciar Sesión'
              )}
            </Button>
          </form>
          <Button
            variant="link"
            className="w-full mt-4"
            onClick={() => {
              setIsRecovering(!isRecovering);
              setError('');
              setSuccessMessage('');
            }}
          >
            {isRecovering 
              ? 'Volver al inicio de sesión'
              : '¿Olvidaste tu contraseña?'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
