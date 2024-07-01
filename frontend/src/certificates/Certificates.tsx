import React, { useState } from 'react';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import DefaultLayout from '../layout/DefaultLayout';
import { CertificateInterface } from './types';
import { getCertificatesByAcmId } from './util';
import './certificate-css.css';

const Certificate = () => {
  const [certificates, setCertificates] = useState<CertificateInterface[]>([]);
  const [acmId, setAcmId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [imgUrl, setImgUrl] = useState<string>('https://sertifier.com/blog/wp-content/uploads/2020/10/certificate-text-samples.jpg');
  const [isSearchVisible, setSearchVisible] = useState<boolean>(true);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAcmId(event.target.value);
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const certificatesData = await getCertificatesByAcmId(acmId);
      setCertificates(certificatesData);
      setImgUrl(certificatesData.length > 0 ? certificatesData[0].imageUrl : '');
      setSearchVisible(false); // Hide search box after search
    } catch (err) {
      setError('Failed to fetch certificates');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DefaultLayout>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A==" crossorigin="anonymous" referrerpolicy="no-referrer" />
      <Breadcrumb pageName="Certificates" />
      <div className="certificates-container">
        <div className="search-container">
          {isSearchVisible && (
            <div className="search">
              <div className="search-box">
                <div className="search-field">
                  <input placeholder="ACM ID" className="input dark:input-white" type="text" value={acmId} onChange={handleInputChange} />
                  <div className="search-box-icon">
                    <button className="btn-icon-content" onClick={handleSearch}>
                      <i className="search-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#ffffff" d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/></svg>
                      </i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <p>Loading certificates...</p>
        ) : error ? (
          <p>{error}</p>
        ) : (
          <>
            <div className="certificate-placeholder">
              <img
                id='certi'
                style={{ filter: imgUrl === 'https://sertifier.com/blog/wp-content/uploads/2020/10/certificate-text-samples.jpg' ? 'blur(15px)' : 'none' }}
                src={imgUrl}
                alt="Certificate Placeholder"
              />
            </div>
          </>
        )}

        <div style={{}} className='download-butn'>
        <a href={imgUrl} download="a.pdf" >
        <i className="fa-solid fa-download butn  dark:text-white"></i>
<<<<<<< Updated upstream
          </a>       
=======
        </a>       
>>>>>>> Stashed changes
        </div>
        <div style={{}} className='retry-butn'>
          <a href='./certificate'>
          <i className="fa-solid fa-rotate-right fa-rotate-180 butn  dark:text-white"></i>
          </a>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default Certificate;

