import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { getGlobalStyles } from './styles';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import ModulePage from './components/ModulePage';
import LessonPage from './components/LessonPage';
import SettingsPage from './components/SettingsPage';
import OnboardingTutorial from './components/OnboardingTutorial';
import ModuleSetup from './components/ModuleSetup';
import Toast from './components/Toast';
import Splash from './components/Splash';
import RevisionChat from './components/RevisionChat';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [screen, setScreen] = useState('loading');
  const [modules, setModules] = useState([]);
  const [activeMod, setActiveMod] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [toast, setToast] = useState(null);
  const [showRevisionChat, setShowRevisionChat] = useState(false);

  const saveNavigationState = (screenName, moduleId = null, lessonId = null) => {
    const state = { screen: screenName, moduleId, lessonId };
    localStorage.setItem('studyos_nav_state', JSON.stringify(state));
  };

  const loadNavigationState = () => {
    try {
      const saved = localStorage.getItem('studyos_nav_state');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };

  const clearNavigationState = () => {
    localStorage.removeItem('studyos_nav_state');
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id, true);
      } else {
        setLoading(false);
        setScreen('auth');
        clearNavigationState();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          if (event === 'SIGNED_IN') {
            await loadProfile(session.user.id, false);
          }
        } else {
          setScreen('auth');
          clearNavigationState();
        }
      })();
    });

    const handleVisibilityChange = async () => {
      if (!document.hidden && user) {
        const navState = loadNavigationState();
        if (navState && navState.screen !== 'auth' && navState.screen !== 'loading' && navState.screen !== screen) {
          await loadModules(user.id);
          await restoreNavigationState(navState, user.id);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, screen]);

  async function loadProfile(userId, shouldRestoreNav = false) {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        const newProfile = {
          id: userId,
          email: session?.user?.email || '',
          color_palette: 'ocean',
          learning_style: {},
          has_completed_onboarding: false
        };

        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert([newProfile]);

        if (insertError) throw insertError;

        setProfile(newProfile);
        setScreen('onboarding');
        clearNavigationState();
      } else {
        setProfile(data);
        if (!data.has_completed_onboarding) {
          setScreen('onboarding');
          clearNavigationState();
        } else {
          await loadModules(userId);

          if (shouldRestoreNav) {
            const navState = loadNavigationState();
            if (navState && navState.screen !== 'auth' && navState.screen !== 'loading') {
              await restoreNavigationState(navState, userId);
            } else {
              setScreen('dash');
            }
          } else {
            setScreen('dash');
          }
        }
      }
    } catch (error) {
      console.error('Profile load error:', error);
      notify('Failed to load profile', 'err');
    } finally {
      setLoading(false);
    }
  }

  async function restoreNavigationState(navState, userId) {
    try {
      if (navState.screen === 'mod' && navState.moduleId) {
        const { data } = await supabase
          .from('modules')
          .select('*')
          .eq('id', navState.moduleId)
          .eq('user_id', userId)
          .maybeSingle();

        if (data) {
          setActiveMod(data);
          setScreen('mod');
        } else {
          setScreen('dash');
        }
      } else if (navState.screen === 'lesson' && navState.moduleId && navState.lessonId) {
        const { data: modData } = await supabase
          .from('modules')
          .select('*')
          .eq('id', navState.moduleId)
          .eq('user_id', userId)
          .maybeSingle();

        const { data: lessonData } = await supabase
          .from('lessons')
          .select('*')
          .eq('id', navState.lessonId)
          .eq('module_id', navState.moduleId)
          .maybeSingle();

        if (modData && lessonData) {
          setActiveMod(modData);
          setActiveLesson(lessonData);
          setScreen('lesson');
        } else if (modData) {
          setActiveMod(modData);
          setScreen('mod');
        } else {
          setScreen('dash');
        }
      } else if (navState.screen === 'settings') {
        setScreen('settings');
      } else {
        setScreen('dash');
      }
    } catch {
      setScreen('dash');
    }
  }

  async function loadModules(userId) {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('user_id', userId)
        .order('position', { ascending: true });

      if (error) throw error;
      setModules(data || []);
    } catch (error) {
      notify('Failed to load modules', 'err');
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setModules([]);
    setScreen('auth');
    clearNavigationState();
  }

  function notify(msg, type = 'ok') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }

  if (loading || screen === 'loading') return <Splash />;

  if (!user || screen === 'auth') {
    return (
      <>
        <style>{getGlobalStyles()}</style>
        <AuthPage onSuccess={() => loadProfile(user?.id)} notify={notify} />
      </>
    );
  }

  const currentPalette = profile?.color_palette || 'ocean';

  if (screen === 'onboarding') {
    return (
      <>
        <style>{getGlobalStyles(currentPalette)}</style>
        <Toast toast={toast} />
        <OnboardingTutorial
          profile={profile}
          onComplete={async () => {
            await supabase
              .from('user_profiles')
              .update({ has_completed_onboarding: true })
              .eq('id', user.id);
            await loadModules(user.id);
            setScreen('dash');
            saveNavigationState('dash');
            notify('Welcome to StudyOS!');
          }}
        />
      </>
    );
  }

  if (screen === 'settings') {
    return (
      <>
        <style>{getGlobalStyles(currentPalette)}</style>
        <Toast toast={toast} />
        <SettingsPage
          profile={profile}
          onBack={() => {
            setScreen('dash');
            saveNavigationState('dash');
          }}
          onUpdate={async (updates) => {
            try {
              const { error } = await supabase
                .from('user_profiles')
                .update(updates)
                .eq('id', user.id);

              if (error) throw error;
              setProfile({ ...profile, ...updates });
              notify('Settings saved');
            } catch (error) {
              notify('Failed to save settings', 'err');
            }
          }}
          onSignOut={signOut}
          notify={notify}
        />
      </>
    );
  }

  if (screen === 'setup') {
    return (
      <>
        <style>{getGlobalStyles(currentPalette)}</style>
        <Toast toast={toast} />
        <ModuleSetup
          userId={user.id}
          onComplete={async (mod) => {
            await loadModules(user.id);
            setActiveMod(mod);
            setScreen('mod');
            saveNavigationState('mod', mod.id);
            notify(`${mod.name} is ready!`);
          }}
          onCancel={() => {
            setScreen('dash');
            saveNavigationState('dash');
          }}
        />
      </>
    );
  }

  if (screen === 'mod' && activeMod) {
    return (
      <>
        <style>{getGlobalStyles(currentPalette)}</style>
        <Toast toast={toast} />
        <ModulePage
          mod={activeMod}
          userId={user.id}
          onBack={() => {
            setScreen('dash');
            saveNavigationState('dash');
            loadModules(user.id);
          }}
          onUpdate={async (updated) => {
            setActiveMod(updated);
            await loadModules(user.id);
          }}
          onOpenLesson={(l) => {
            setActiveLesson(l);
            setScreen('lesson');
            saveNavigationState('lesson', activeMod.id, l.id);
          }}
          notify={notify}
        />
      </>
    );
  }

  if (screen === 'lesson' && activeLesson && activeMod) {
    return (
      <>
        <style>{getGlobalStyles(currentPalette)}</style>
        <Toast toast={toast} />
        <LessonPage
          lesson={activeLesson}
          mod={activeMod}
          userId={user.id}
          profile={profile}
          onBack={() => {
            setScreen('mod');
            saveNavigationState('mod', activeMod.id);
          }}
          onUpdate={async (ul) => {
            setActiveLesson(ul);
            await loadModules(user.id);
          }}
          notify={notify}
        />
      </>
    );
  }

  return (
    <>
      <style>{getGlobalStyles(currentPalette)}</style>
      <Toast toast={toast} />
      <Dashboard
        modules={modules}
        profile={profile}
        onNew={() => {
          setScreen('setup');
          saveNavigationState('setup');
        }}
        onOpen={(m) => {
          setActiveMod(m);
          setScreen('mod');
          saveNavigationState('mod', m.id);
        }}
        onSettings={() => {
          setScreen('settings');
          saveNavigationState('settings');
        }}
        onOpenRevisionChat={() => setShowRevisionChat(true)}
        onReorderModules={async (reordered) => {
          setModules(reordered);
          for (let i = 0; i < reordered.length; i++) {
            await supabase
              .from('modules')
              .update({ position: i })
              .eq('id', reordered[i].id);
          }
        }}
        notify={notify}
      />
      {showRevisionChat && (
        <RevisionChat
          userId={user.id}
          modules={modules}
          onNavigateToLesson={(lesson) => {
            setActiveLesson(lesson);
            setScreen('lesson');
            saveNavigationState('lesson', lesson.module_id, lesson.id);
            setShowRevisionChat(false);
          }}
          onClose={() => setShowRevisionChat(false)}
          notify={notify}
        />
      )}
    </>
  );
}
