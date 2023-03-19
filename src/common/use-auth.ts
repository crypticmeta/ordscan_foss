import React, { useCallback, useEffect, useMemo } from 'react';

import { AppState, defaultState } from './context';
import { AppConfig, UserSession } from '@stacks/auth';
import { AuthOptions } from '@stacks/connect';

export function useAuth() {
  const [state, setState] = React.useState<AppState>(defaultState());
  const [authResponse, setAuthResponse] = React.useState('');
  const [appPrivateKey, setAppPrivateKey] = React.useState('');

  const appConfig = useMemo(
    () => new AppConfig(['store_write', 'publish_data'], process.env.NEXT_PUBLIC_DOMAIN),
    []
  );
  const userSession = useMemo(() => new UserSession({ appConfig }), [appConfig]);

  const handleSignOut = useCallback(() => {
    userSession.signUserOut();
    setState({ userData: null });
  }, [userSession]);

  const handleRedirectAuth = useCallback(async () => {
    if (userSession.isSignInPending()) {
      const userData = await userSession.handlePendingSignIn();
      setState({ userData });
      setAppPrivateKey(userData.appPrivateKey);
    } else if (userSession.isUserSignedIn()) {
      setAppPrivateKey(userSession.loadUserData().appPrivateKey);
    }
  }, [userSession]);

  const onFinish = useCallback(({ userSession, authResponse }) => {
    console.log({ userSession, authResponse });
    const userData = userSession.loadUserData();
    setAppPrivateKey(userSession.loadUserData().appPrivateKey);
    setAuthResponse(authResponse);
    setState({ userData });
  }, []);

  const onCancel = useCallback(() => {
    console.log('popup closed!');
  }, []);

  useEffect(() => {
    void handleRedirectAuth();
    if (userSession.isUserSignedIn() && !state.userData) {
      const userData = userSession.loadUserData();
      setState({ userData });
    }
  }, [handleRedirectAuth, userSession, state]);

  const authOptions: AuthOptions = {
    manifestPath: '/static/manifest.json',
    redirectTo: '/',
    userSession,
    onFinish,
    onCancel,
    appDetails: {
      name: 'Ordscan',
      icon: 'https://ordscan.xyz/favicon.ico',
    },
  };
  return {
    authOptions,
    state,
    authResponse,
    appPrivateKey,
    handleSignOut,
  };
}