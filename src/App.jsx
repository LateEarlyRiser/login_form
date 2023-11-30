import React, { useState, useEffect } from 'react';
import {
  Route,
  Routes,
  useLocation,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import { atom, selector, useRecoilState, useRecoilValue } from 'recoil';
import {
  isSigning,
  loadingState,
  loginState,
  userObjState,
} from './util/recoil.jsx';
import Loading from './components/Loading.jsx';
import Home from './routes/Home.jsx';
import Auth from './routes/Auth.jsx';
import Signup from './routes/Signup.jsx';
import Login from './routes/Login.jsx';
import { getCookie, setCookie } from './util/cookie.jsx';
import { authService } from './fbase';
import { useQuery } from 'react-query';
import axios from 'axios';
import './App.css';
import Tweet from './routes/Tweet.jsx';
import TweetDetail from './routes/TweetDetail.jsx';
import Mention from './routes/Mention.jsx';
import Profile from './routes/Profile.jsx';
import Follow from './routes/Follow.jsx';

function App() {
  // 전역 변수 recoil
  const [loading, setLoading] = useRecoilState(loadingState);
  const [isLoggedIn, setIsLoggedIn] = useRecoilState(loginState);
  const [userObj, setUserObj] = useRecoilState(userObjState);
  const [signing, setSigning] = useRecoilState(isSigning);

  // 지역 변수
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  const navigate = useNavigate();

  // for modal background
  const location = useLocation();
  const background = location.state && location.state.background;

  useEffect(() => {
    // 새로 고침후 지속적 로그인, use query는 실행조건을 login이 돼있을때로 해놔서 login 상관없이 한번만 실행하는 useeffect 사용
    if (getCookie('accessToken')) {
      axios
        .get(`${import.meta.env.VITE_REACT_APP_BACKEND_URL}/validateToken`, {
          params: {
            accessToken: getCookie('accessToken'),
            refreshTokenId: getCookie('refreshTokenId'),
          },
        })
        .then((response) => {
          if (response.status === 200) {
            const user = response.data.user;
            if (response.data.accessToken) {
              const currentDateTime = new Date();
              const accessTokenExpiry = new Date(currentDateTime);
              accessTokenExpiry.setMinutes(currentDateTime.getMinutes() + 30);

              setCookie('accessToken', response.data.accessToken, {
                path: '/',
                secure: false,
                expires: accessTokenExpiry,
              });
            }
            setUserObj(user);
            setIsLoggedIn({ login: true, social: false });
            setIsAuthChecked(true);
          }
        })
        .catch((error) => {
          console.log(error);
          if (error.response && error.response.status === 400) {
            console.log('유효한 토큰이 아닙니다.');
            setIsAuthChecked(true);
          } else {
            console.log('서버 오류가 발생했습니다.');
          }
        });
    }

    // social login했을때 로그인 유지
    authService.onAuthStateChanged((user) => {
      if (user) {
        setUserObj({
          // Auth에 담겨 있는 값
          displayName: user.displayName,
          id: user.displayName,
          uid: user.uid,
          photoURL: user.photoURL,
          backgroundImage: 'https://placehold.co/600x400/1DA1F2/1DA1F2.png',
          SignupAt: Date.now(),
          following: ['3431d11c-cf44-481b-805d-0835f7e77a68'],
          follower: [],
        });
        setIsLoggedIn({ login: true, social: true });
        setIsAuthChecked(true);
      } else {
        setIsAuthChecked(true);
      }
    });
  }, []);

  // 로그인 후에 지속적 로그인
  const {
    data: validLogin,
    isLoading: validLoading,
    error: validError,
  } = useQuery(
    'validateToken',
    () => {
      return axios.get(
        `${import.meta.env.VITE_REACT_APP_BACKEND_URL}/validateToken`,
        {
          params: {
            accessToken: getCookie('accessToken'),
            refreshTokenId: getCookie('refreshTokenId'),
          },
        },
      );
    },
    {
      cacheTime: 60000 * 30, // 1분 * 30
      staleTime: 60000 * 30,
      retry: false,
      enabled: !!isLoggedIn.login && !signing,
    },
  );

  // use query의 response가 변화할 때 실행
  useEffect(() => {
    if (validLogin) {
      const user = validLogin.data.user;
      if (validLogin.data.accessToken) {
        const currentDateTime = new Date();
        const accessTokenExpiry = new Date(currentDateTime);
        accessTokenExpiry.setMinutes(currentDateTime.getMinutes() + 30);

        setCookie('accessToken', validLogin.data.accessToken, {
          path: '/',
          secure: false,
          expires: accessTokenExpiry,
        });
      }
      setUserObj(user);
      setIsLoggedIn({ login: true, social: false });
      setIsAuthChecked(true);
      navigate('/');
    }
    if (validError) {
      console.log(validError);
    }
  }, [validLogin, validError]);

  // 로그인 후 새로고침 || 로그인 실패? || 회원가입 할 때(6번째 페이지)
  return (
    <div>
      {(!isAuthChecked || (isAuthChecked && !isLoggedIn.login) || loading) && (
        <Loading forComponent={false} />
      )}
      {isLoggedIn.login && !signing ? (
        <>
          <Routes location={background || location}>
            <Route path="/" element={<Home />} />
            <Route
              path="/:profile/:tweetPath"
              element={<TweetDetail userObj={userObj} />}
            />
            <Route path="/profile/:profile" element={<Profile />} />
            <Route path="/profile/:profile/follow" element={<Follow />} />
          </Routes>
          {background && (
            <Routes>
              <Route path="/compose/tweet" element={<Tweet />} />
              <Route path="/compose/mention" element={<Mention />} />
            </Routes>
          )}
        </>
      ) : (
        <>
          <Routes location={background || location}>
            <Route path="/" element={<Auth />} />
            <Route
              path="/signup"
              element={<Signup setSigning={setSigning} />}
            />
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={<Navigate to="/" />} />
          </Routes>
          {background && (
            <Routes>
              <Route
                path="/signup"
                element={<Signup setSigning={setSigning} />}
              />
              <Route path="/login" element={<Login />} />
              <Route path="/*" element={<Navigate to="/" />} />
            </Routes>
          )}
        </>
      )}
    </div>
  );
}

export default App;
