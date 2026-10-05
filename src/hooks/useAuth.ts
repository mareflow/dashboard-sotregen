import { useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [profile, setProfile] = useState<any | null>(null);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (!error && data) {
        setProfile(data);
      }
    } catch (err) {
      console.warn('Erro ao carregar perfil do usuário:', err);
    }
  };

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // 2. Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    return data;
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
  };

  const email = user?.email?.toLowerCase().trim() || '';
  const adminEmails = ['admin@sotregen', 'ia.mareflow@gmail.com'];
  const coordinatorEmails = ['kauan@sotregen', 'gustavo@sotregen'];

  let role: 'admin' | 'coordenador' | 'gestor' = 'gestor';
  if (adminEmails.includes(email)) {
    role = 'admin';
  } else if (coordinatorEmails.includes(email) || profile?.full_name?.toLowerCase().includes('coordenador')) {
    role = 'coordenador';
  } else if (profile?.role === 'gestor' || profile?.full_name?.toLowerCase().includes('gestor')) {
    role = 'gestor';
  } else {
    role = (profile?.role as any) || 'gestor';
  }

  return {
    user,
    session,
    profile,
    role,
    isAdmin: role === 'admin',
    isCoordinator: role === 'coordenador',
    isGestor: role === 'gestor',
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
    refreshProfile: () => user && fetchProfile(user.id),
  };
}
