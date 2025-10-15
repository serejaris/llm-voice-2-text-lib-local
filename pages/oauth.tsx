import * as React from 'react';
import * as Utilities from '@common/shared-utilities';

import Cookies from 'js-cookie';

// Note: This page uses Server.decrypt which has been removed as it's not needed for local-only MVP.
// If OAuth functionality is needed in the future, this will need to be reimplemented.

function OAuthPage(props) {
  React.useEffect(() => {
    if (Utilities.isEmpty(props.code)) {
      window.location.replace('/');
    }

    Cookies.set('sitekey', props.code, { secure: true });
    window.location.replace('/examples/features/authentication/google');
  });

  return <div>Redirecting...</div>;
}

export async function getServerSideProps(context) {
  // OAuth functionality disabled for local-only MVP
  // Server.decrypt has been removed as it's not needed
  return {
    redirect: {
      permanent: false,
      destination: `/`,
    },
  };
}

export default OAuthPage;
