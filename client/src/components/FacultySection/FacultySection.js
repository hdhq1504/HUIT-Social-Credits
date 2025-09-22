// import React, { useRef } from 'react';
// import classNames from 'classnames/bind';
// import { Link } from 'react-router-dom';
// import Slider from 'react-slick';
// import 'slick-carousel/slick/slick.css';
// import 'slick-carousel/slick/slick-theme.css';
// import styles from './FacultySection.module.scss';

// const cx = classNames.bind(styles);

// function FacultySection({ faculties }) {
//     const sliderRef = useRef(null);

//     const settings = {
//         dots: false,
//         infinite: true,
//         speed: 500,
//         arrows: false,
//         slidesToShow: 5,
//         slidesToScroll: 1,
//         draggable: true,
//         swipeToSlide: true,
//         autoplay: true,
//         autoplaySpeed: 2000,
//         centerPadding: '20px',
//         responsive: [
//             {
//                 breakpoint: 1024,
//                 settings: {
//                     slidesToShow: 3,
//                     slidesToScroll: 1,
//                     infinite: true,
//                     dots: false,
//                     draggable: true,
//                     swipeToSlide: true,
//                 },
//             },
//             {
//                 breakpoint: 768,
//                 settings: {
//                     slidesToShow: 2,
//                     slidesToScroll: 1,
//                     draggable: true,
//                     swipeToSlide: true,
//                 },
//             },
//             {
//                 breakpoint: 480,
//                 settings: {
//                     slidesToShow: 1,
//                     slidesToScroll: 1,
//                     draggable: true,
//                     swipeToSlide: true,
//                 },
//             },
//         ],
//     };

//     if (!faculties || faculties.length === 0) {
//         return (
//             <section className={cx('wrapper')}>
//                 <h2 className={cx('title')}>
//                     <span className={cx('highlight')}>CÁC KHOA</span> CHUYÊN NGÀNH
//                 </h2>
//                 <p>Không có khoa nào để hiển thị.</p>
//             </section>
//         );
//     }

//     return (
//         <section className={cx('wrapper')}>
//             <h2 className={cx('title')}>
//                 <span className={cx('highlight')}>CÁC KHOA</span> CHUYÊN NGÀNH
//             </h2>

//             <div className={cx('faculties-carousel')}>
//                 <div className={cx('carousel-list')}>
//                     <Slider {...settings} ref={sliderRef}>
//                         {faculties.map((faculty) => (
//                             <div key={faculty.id} className={cx('carousel-item')}>
//                                 <Link className={cx('faculty-item')} to={`/faculty/${faculty.MaKhoa}`}>
//                                     <div className={cx('faculty-logo')}>
//                                         <img
//                                             src={faculty.image}
//                                             alt={faculty.TenKhoa}
//                                             onError={(e) => {
//                                                 e.target.src = '/images/default-logo.png';
//                                             }}
//                                         />
//                                     </div>
//                                     <div className={cx('faculty-name')}>{faculty.TenKhoa}</div>
//                                 </Link>
//                             </div>
//                         ))}
//                     </Slider>
//                 </div>
//             </div>
//         </section>
//     );
// }

// export default FacultySection;

import React, { useRef } from 'react';
import classNames from 'classnames/bind';
import { Link } from 'react-router-dom';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import styles from './FacultySection.module.scss';

const cx = classNames.bind(styles);

function FacultySection({ faculties }) {
    console.log('Faculties trong FacultySection:', faculties);
    const sliderRef = useRef(null);

    const settings = {
        dots: false,
        infinite: true,
        speed: 500,
        arrows: false,
        slidesToShow: 5,
        slidesToScroll: 1,
        draggable: true,
        swipeToSlide: true,
        autoplay: true,
        autoplaySpeed: 2000,
        centerPadding: '20px',
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 1,
                    infinite: true,
                    dots: false,
                    draggable: true,
                    swipeToSlide: true,
                },
            },
            {
                breakpoint: 768,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1,
                    draggable: true,
                    swipeToSlide: true,
                },
            },
            {
                breakpoint: 480,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    draggable: true,
                    swipeToSlide: true,
                },
            },
        ],
    };

    if (!faculties || faculties.length === 0) {
        return (
            <section className={cx('wrapper')}>
                <h2 className={cx('title')}>
                    <span className={cx('highlight')}>CÁC KHOA</span> CHUYÊN NGÀNH
                </h2>
                <p>Không có khoa nào để hiển thị.</p>
            </section>
        );
    }

    return (
        <section className={cx('wrapper')}>
            <h2 className={cx('title')}>
                <span className={cx('highlight')}>CÁC KHOA</span> CHUYÊN NGÀNH
            </h2>

            <div className={cx('faculties-carousel')}>
                <div className={cx('carousel-list')}>
                    <Slider {...settings} ref={sliderRef}>
                        {faculties.map((faculty) => (
                            <div key={faculty.id} className={cx('carousel-item')}>
                                <Link
                                    className={cx('faculty-item')}
                                    to={`/filterSubject?course=${encodeURIComponent(faculty.MaKhoa)}`}
                                >
                                    <div className={cx('faculty-logo')}>
                                        <img
                                            src={faculty.image}
                                            alt={faculty.TenKhoa}
                                            onError={(e) => {
                                                e.target.src = '/images/default-logo.png';
                                            }}
                                        />
                                    </div>
                                    <div className={cx('faculty-name')}>{faculty.TenKhoa}</div>
                                </Link>
                            </div>
                        ))}
                    </Slider>
                </div>
            </div>
        </section>
    );
}

export default FacultySection;
