import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    MenuItem,
    TextField,
    Select,
    FormControl,
    InputLabel,
} from '@mui/material';

const ReportFormModal = ({
    showReportForm,
    setShowReportForm,
    reportReason,
    setReportReason,
    reportDescription,
    setReportDescription,
    reportItemId,
    setReportItemId,
    handleReportSubmit,
    cx, // truyền classnames từ component cha
}) => {
    const handleClose = () => {
        setShowReportForm(false);
        setReportReason('');
        setReportDescription('');
        setReportItemId(null);
    };

    return (
        <Dialog open={showReportForm} onClose={handleClose} className={cx('report-modal')} disableScrollLock={true}>
            <DialogTitle>Báo cáo tài liệu</DialogTitle>
            <DialogContent className={cx('report-modal-content')}>
                <form onSubmit={handleReportSubmit}>
                    <FormControl fullWidth margin="normal" className={cx('form-group')}>
                        <InputLabel>Kiểu vi phạm</InputLabel>
                        <Select
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            label="Kiểu vi phạm"
                            required
                            sx={{
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#00008b', // Màu viền khi focus
                                    borderWidth: '2px', // Tăng độ dày viền khi focus (tuỳ chọn)
                                },
                            }}
                        >
                            <MenuItem value="">Chọn kiểu vi phạm</MenuItem>
                            <MenuItem value="spam">Nội dung spam</MenuItem>
                            <MenuItem value="inappropriate">Nội dung không phù hợp</MenuItem>
                            <MenuItem value="copyright">Vi phạm bản quyền</MenuItem>
                            <MenuItem value="other">Khác</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl fullWidth margin="normal" className={cx('form-group')}>
                        <TextField
                            multiline
                            rows={4}
                            label="Lý do báo cáo"
                            value={reportDescription}
                            onChange={(e) => setReportDescription(e.target.value)}
                            placeholder="Nhập lý do báo cáo"
                            variant="outlined"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                        borderColor: '#00008b', // Màu viền khi focus
                                        borderWidth: '2px', // Độ dày viền khi focus
                                    },
                                },
                            }}
                        />
                    </FormControl>
                </form>
            </DialogContent>
            <DialogActions>
                <Button
                    type="submit"
                    variant="contained"
                    onClick={handleReportSubmit}
                    className={cx('report-submit-btn')}
                >
                    Báo cáo
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ReportFormModal;
