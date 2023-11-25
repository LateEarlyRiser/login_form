import { useInfiniteQuery } from 'react-query';
import axios from 'axios';

export const useGetMyTweets = ({ size, userObj, pageName }) =>
  useInfiniteQuery(
    ['getTweets', userObj],
    ({ pageParam = 0 }) => {
      const requestData = {
        userId: userObj.uid,
        pageName: pageName,
        page: pageParam,
        size,
      };
      return axios.post(
        `${import.meta.env.VITE_REACT_APP_BACKEND_URL}/getMyTweets`,
        requestData,
      );
    },
    {
      getNextPageParam: (lastPage, pages) => {
        const nextPage = lastPage.data.pageNumber + 1;
        return lastPage.data.isLastPage ? undefined : nextPage;
      },
      cacheTime: 1000 * 60 * 5, // 예: 5분
      staleTime: 1000 * 60 * 0, // 예: 1분
    },
  );
