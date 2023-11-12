import { useMutation } from 'react-query';
import axios from 'axios';

const useUpdateProfile = () =>
  useMutation((userData) => {
    // FormData 객체 생성
    const formData = new FormData();
    formData.append('uid', userData.uid);
    formData.append('name', userData.name);
    formData.append('attachmentUrl', userData.attachmentUrl); // 파일 객체 추가

    axios.post(
      `${import.meta.env.VITE_REACT_APP_BACKEND_URL}/updateProfile`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
  });

export default useUpdateProfile;
