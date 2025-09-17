import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, EyeOff, Loader2, HardHat, Building2, Users } from 'lucide-react';
import logoGIO from '@/assets/images/logoGIO.png';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      await signIn(data.email, data.password);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e2938] via-[#1e6076] to-[#12b0a0] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-y-12 scale-150"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform skew-y-12 scale-150"></div>
      </div>
      
      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left Side - Branding & Info */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 text-white">
          <div className="space-y-6">
            <img 
              src={logoGIO} 
              alt="GIO Logo" 
              className="h-16 w-auto object-contain"
            />
            <div>
              <h1 className="text-5xl font-bold leading-tight mb-4">
                Sistema de<br />
                <span className="text-[#12b0a0]">Saúde e Segurança</span><br />
                do Trabalho
              </h1>
              <p className="text-xl text-white/80 leading-relaxed">
                Gerencie avaliações de segurança, acompanhe conformidades e 
                mantenha seus canteiros de obra seguros e em conformidade.
              </p>
            </div>
          </div>
          
          {/* Features */}
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
              <div className="p-3 bg-[#12b0a0] rounded-xl">
                <HardHat className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Avaliações de Obra</h3>
                <p className="text-white/70 text-sm">Controle completo da segurança no canteiro</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
              <div className="p-3 bg-[#1e6076] rounded-xl">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Gestão de Alojamentos</h3>
                <p className="text-white/70 text-sm">Monitore condições dos alojamentos</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
              <div className="p-3 bg-[#baa673] rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Relatórios Detalhados</h3>
                <p className="text-white/70 text-sm">Acompanhe métricas e performance</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-md shadow-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-0">
            <CardHeader className="space-y-4 text-center pb-8">
              <div className="lg:hidden">
                <img 
                  src={logoGIO} 
                  alt="GIO Logo" 
                  className="h-12 w-auto object-contain mx-auto mb-4"
                />
              </div>
              <div className="p-3 bg-gradient-to-br from-[#12b0a0] to-[#1e6076] rounded-2xl w-16 h-16 mx-auto flex items-center justify-center">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Bem-vindo de volta
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400 mt-2">
                  Faça login para acessar o sistema de segurança
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="seu@email.com"
                      {...register('email')}
                      className={`mt-1 h-12 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : 'focus-visible:ring-[#12b0a0]'}`}
                    />
                    {errors.email && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Senha
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        {...register('password')}
                        className={`h-12 pr-12 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : 'focus-visible:ring-[#12b0a0]'}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-12 px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                    {errors.password && (
                      <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-[#12b0a0] to-[#1e6076] hover:from-[#0f9d8a] hover:to-[#1a5a6b] text-white font-semibold text-base shadow-lg transition-all duration-200"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    'Entrar no Sistema'
                  )}
                </Button>
              </form>
              
              {/* Footer */}
              <div className="text-center pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Sistema protegido por autenticação segura
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}