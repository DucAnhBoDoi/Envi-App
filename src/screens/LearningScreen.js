import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LearningScreen() {
  const [activeTab, setActiveTab] = useState("library");
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [completedTips, setCompletedTips] = useState([]);
  const [quizHistory, setQuizHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load dữ liệu từ AsyncStorage khi app khởi động
  useEffect(() => {
    loadData();
  }, []);

  // Save dữ liệu vào AsyncStorage mỗi khi quizHistory hoặc completedTips thay đổi
  useEffect(() => {
    if (!isLoading) {
      saveData();
    }
  }, [quizHistory, completedTips]);

  // Hàm load dữ liệu từ AsyncStorage
  const loadData = async () => {
    try {
      const savedQuizHistory = await AsyncStorage.getItem("learningQuizHistory");
      const savedCompletedTips = await AsyncStorage.getItem("learningCompletedTips");

      if (savedQuizHistory) {
        setQuizHistory(JSON.parse(savedQuizHistory));
      }
      if (savedCompletedTips) {
        setCompletedTips(JSON.parse(savedCompletedTips));
      }

      setIsLoading(false);
    } catch (error) {
      console.error("❌ Lỗi khi load dữ liệu:", error);
      setIsLoading(false);
    }
  };

  // Hàm save dữ liệu vào AsyncStorage
  const saveData = async () => {
    try {
      await AsyncStorage.setItem("learningQuizHistory", JSON.stringify(quizHistory));
      await AsyncStorage.setItem("learningCompletedTips", JSON.stringify(completedTips));
    } catch (error) {
      console.error("❌ Lỗi khi lưu dữ liệu:", error);
    }
  };

  // DANH SÁCH CÁC BÀI QUIZ
 const quizzes = [
  {
    id: 1,
    title: "Bài 1: Rác Thải Nhựa & Ô Nhiễm",
    icon: "trash",
    color: "#FF6B6B",
    level: "Beginner",
    questions: [
      {
        question: "Bao lâu thì một túi nilon phân hủy hoàn toàn?",
        options: ["1-5 năm", "10-20 năm", "100-500 năm", "1000 năm"],
        correct: 2,
      },
      {
        question: "Loại rác nào có thể tái chế?",
        options: ["Giấy, nhựa, kim loại", "Thức ăn thừa", "Pin, bóng đèn", "Tất cả các loại trên"],
        correct: 0,
      },
      {
        question: "Màu thùng rác nào dùng cho rác tái chế?",
        options: ["Đen", "Xanh lá", "Vàng", "Đỏ"],
        correct: 2,
      },
      {
        question: "Sử dụng túi vải thay cho túi nilon giúp gì?",
        options: ["Tiết kiệm tiền", "Giảm rác nhựa", "Tăng cân", "Không có tác dụng"],
        correct: 1,
      },
      {
        question: "Rác thải nhựa nên được xử lý thế nào?",
        options: ["Tái chế hoặc thu gom", "Vứt ra biển", "Đốt tại nhà", "Chôn dưới đất bất kỳ"],
        correct: 0,
      },
      // Mới
      {
        question: "Ô nhiễm trắng là gì?",
        options: ["Ô nhiễm do khói bụi", "Ô nhiễm do rác thải nhựa", "Ô nhiễm do nước thải", "Ô nhiễm do tiếng ồn"],
        correct: 1,
      },
      {
        question: "Loại nhựa nào thường được tái chế nhiều nhất?",
        options: ["Nhựa PET", "Nhựa PVC", "Nhựa PP", "Nhựa PS"],
        correct: 0,
      },
      {
        question: "Hành động nào sau đây gây ô nhiễm nhựa nghiêm trọng?",
        options: ["Sử dụng chai thủy tinh", "Vứt túi nhựa ra môi trường", "Tái chế chai nhựa", "Sử dụng túi vải"],
        correct: 1,
      },
      {
        question: "Microplastic là gì?",
        options: ["Nhựa tái chế", "Nhựa phân hủy sinh học", "Hạt nhựa siêu nhỏ gây ô nhiễm", "Nhựa dùng trong y tế"],
        correct: 2,
      },
      {
        question: "Tại sao rác thải nhựa nguy hiểm cho đại dương?",
        options: ["Làm tăng nhiệt độ nước", "Gây hại cho sinh vật biển", "Làm nước sạch hơn", "Không ảnh hưởng"],
        correct: 1,
      },
    ],
  },
  {
    id: 2,
    title: "Bài 2: Tiết Kiệm Năng Lượng",
    icon: "flash",
    color: "#FFA726",
    level: "Beginner",
    questions: [
      {
        question: "Hành động nào tiết kiệm năng lượng nhất?",
        options: ["Bật điều hòa 24/7", "Tắt thiết bị khi không dùng", "Mở cửa tủ lạnh liên tục", "Để máy tính luôn bật"],
        correct: 1,
      },
      {
        question: "Sử dụng đèn LED thay cho đèn dây tóc giúp gì?",
        options: ["Tiết kiệm điện", "Tốn điện hơn", "Không ảnh hưởng", "Làm nóng nhà"],
        correct: 0,
      },
      {
        question: "Khi nào nên tắt máy tính nếu không dùng?",
        options: ["Khi đi ngủ hoặc ra ngoài", "Khi đang làm việc", "Luôn bật 24/7", "Chỉ tắt khi pin yếu"],
        correct: 0,
      },
      {
        question: "Tắt điện khi ra ngoài có thể tiết kiệm bao nhiêu?",
        options: ["5% hóa đơn", "10% hóa đơn", "20% hóa đơn", "50% hóa đơn"],
        correct: 1,
      },
      {
        question: "Thiết bị nào tiêu thụ điện năng nhiều nhất?",
        options: ["Tivi", "Điều hòa không khí", "Tủ lạnh", "Máy giặt"],
        correct: 1,
      },
      // Mới
      {
        question: "Nguồn năng lượng nào dưới đây tiết kiệm nhất cho hộ gia đình?",
        options: ["Điện than", "Điện mặt trời", "Điện dầu mỏ", "Điện hạt nhân"],
        correct: 1,
      },
      {
        question: "Chế độ chờ (standby) của thiết bị điện gây ra điều gì?",
        options: ["Không tiêu thụ điện", "Tiêu thụ điện nhỏ", "Tăng tuổi thọ thiết bị", "Tắt hoàn toàn"],
        correct: 1,
      },
      {
        question: "Việc sử dụng quạt thay cho điều hòa giúp gì?",
        options: ["Tăng tiêu thụ điện", "Giảm tiêu thụ điện", "Không ảnh hưởng", "Tăng nhiệt độ phòng"],
        correct: 1,
      },
      {
        question: "Hành động nào giúp giảm tiêu thụ năng lượng khi giặt đồ?",
        options: ["Giặt bằng nước nóng", "Giặt đầy tải", "Sử dụng máy sấy liên tục", "Giặt từng món nhỏ"],
        correct: 1,
      },
      {
        question: "Điện năng tiêu thụ được đo bằng đơn vị nào?",
        options: ["Volt", "Watt", "Kilowatt giờ (kWh)", "Ampere"],
        correct: 2,
      },
    ],
  },
  {
    id: 3,
    title: "Bài 3: Bảo Vệ Môi Trường",
    icon: "leaf",
    color: "#4CAF50",
    level: "Intermediate",
    questions: [
      {
        question: "Cây xanh có vai trò gì với môi trường?",
        options: ["Chỉ làm đẹp", "Hấp thụ CO2, tạo O2", "Không có tác dụng", "Gây ô nhiễm"],
        correct: 1,
      },
      {
        question: "Hành động nào giảm lượng CO2 thải ra?",
        options: ["Đi xe máy liên tục", "Đi bộ hoặc đi xe đạp", "Sử dụng điều hòa 24/7", "Sử dụng xe hơi riêng"],
        correct: 1,
      },
      {
        question: "Sử dụng phương tiện công cộng giúp gì?",
        options: ["Giảm ô nhiễm, giảm tắc đường", "Tốn tiền hơn", "Gây ô nhiễm", "Không ảnh hưởng gì"],
        correct: 0,
      },
      {
        question: "Bảo vệ môi trường là trách nhiệm của ai?",
        options: ["Chỉ chính phủ", "Chỉ doanh nghiệp", "Toàn xã hội", "Chỉ các nhà khoa học"],
        correct: 2,
      },
      {
        question: "Ngày Môi trường Thế giới là ngày nào?",
        options: ["5/6", "22/4", "1/1", "25/12"],
        correct: 0,
      },
      // Mới
      {
        question: "Hiệu ứng nhà kính là gì?",
        options: ["Tăng nhiệt độ Trái Đất", "Giảm ô nhiễm không khí", "Tăng lượng mưa", "Giảm nhiệt độ"],
        correct: 0,
      },
      {
        question: "Hành động nào giúp bảo vệ rừng?",
        options: ["Đốt rừng làm nông nghiệp", "Trồng cây mới", "Khai thác gỗ bất hợp pháp", "Xây dựng nhà máy trong rừng"],
        correct: 1,
      },
      {
        question: "Loài động vật nào bị ảnh hưởng nặng bởi ô nhiễm môi trường?",
        options: ["Chó nhà", "Rùa biển", "Chim sẻ", "Mèo nhà"],
        correct: 1,
      },
      {
        question: "Việc sử dụng năng lượng tái tạo giúp gì?",
        options: ["Tăng ô nhiễm", "Giảm khí thải nhà kính", "Tăng giá điện", "Không ảnh hưởng"],
        correct: 1,
      },
      {
        question: "Hành động nào góp phần bảo vệ môi trường biển?",
        options: ["Xả rác xuống biển", "Thu gom rác trên bãi biển", "Đánh bắt cá quá mức", "Xây cảng lớn"],
        correct: 1,
      },
    ],
  },
  {
    id: 4,
    title: "Bài 4: Phân Loại Rác Đúng Cách",
    icon: "analytics",
    color: "#2196F3",
    level: "Intermediate",
    questions: [
      {
        question: "Nên đổ pin và ắc quy vào thùng rác nào?",
        options: ["Thùng rác tái chế", "Thùng rác hữu cơ", "Thùng rác nguy hại", "Thùng rác tổng hợp"],
        correct: 2,
      },
      {
        question: "Rác hữu cơ bao gồm những gì?",
        options: ["Thức ăn thừa, vỏ trái cây", "Chai nhựa, lon", "Pin, bóng đèn", "Giấy, bìa cứng"],
        correct: 0,
      },
      {
        question: "Thức ăn thừa nên xử lý thế nào?",
        options: ["Vứt vào thùng rác", "Tái chế làm phân compost", "Đổ ra sông", "Đốt cháy"],
        correct: 1,
      },
      {
        question: "Hướng dẫn phân loại rác đúng cách:",
        options: ["Rác hữu cơ → xanh, Tái chế → vàng", "Rác hữu cơ → đỏ, Tái chế → xanh", "Tất cả rác vào một thùng", "Rác hữu cơ → vàng, Tái chế → xanh"],
        correct: 0,
      },
      {
        question: "Mục đích chính của phân loại rác?",
        options: ["Tiết kiệm diện tích", "Tái chế và giảm ô nhiễm", "Đẹp mắt", "Để cho vui"],
        correct: 1,
      },
      // Mới
      {
        question: "Rác nguy hại bao gồm những gì?",
        options: ["Thức ăn thừa", "Pin, hóa chất", "Giấy báo", "Chai nhựa"],
        correct: 1,
      },
      {
        question: "Việc phân loại rác giúp gì cho nhà máy tái chế?",
        options: ["Tăng chi phí xử lý", "Giảm hiệu quả", "Tăng hiệu quả tái chế", "Không ảnh hưởng"],
        correct: 2,
      },
      {
        question: "Loại rác nào không nên vứt vào thùng rác tái chế?",
        options: ["Chai nhựa sạch", "Giấy sạch", "Thức ăn bám dính", "Kim loại"],
        correct: 2,
      },
      {
        question: "Rác tái chế thường được làm gì sau khi thu gom?",
        options: ["Đốt cháy", "Chôn lấp", "Tái sử dụng hoặc chế biến", "Vứt ra sông"],
        correct: 2,
      },
      {
        question: "Thùng rác màu đỏ thường dùng cho loại rác nào?",
        options: ["Rác tái chế", "Rác hữu cơ", "Rác nguy hại", "Rác tổng hợp"],
        correct: 2,
      },
    ],
  },
  {
    id: 5,
    title: "Bài 5: Tiết Kiệm Nước & Thực Phẩm",
    icon: "water",
    color: "#26A69A",
    level: "Intermediate",
    questions: [
      {
        question: "Tắm nước nhanh gọn có thể tiết kiệm bao nhiêu nước?",
        options: ["10L/ngày", "30L/ngày", "50L/ngày", "100L/ngày"],
        correct: 2,
      },
      {
        question: "Điều gì giúp giảm lượng nước tiêu thụ?",
        options: ["Tắm lâu", "Tắt vòi khi đánh răng", "Rửa xe liên tục", "Đổ nước ra ngoài"],
        correct: 1,
      },
      {
        question: "Nên dùng bình nước cá nhân thay chai nhựa để làm gì?",
        options: ["Tiết kiệm chi phí", "Giảm rác nhựa", "Tăng sức khỏe", "Không có tác dụng"],
        correct: 1,
      },
      {
        question: "Lập kế hoạch mua sắm giúp gì?",
        options: ["Tốn tiền", "Tránh lãng phí thức ăn", "Không ảnh hưởng", "Ăn nhiều hơn"],
        correct: 1,
      },
      {
        question: "Mua thực phẩm theo mùa có lợi ích gì?",
        options: ["Giá cao hơn", "Giảm năng lượng trồng trọt", "Giảm chất lượng", "Không có lợi ích"],
        correct: 1,
      },
      // Mới
      {
        question: "Việc tái sử dụng nước mưa có lợi ích gì?",
        options: ["Tăng chi phí", "Giảm lượng nước tiêu thụ", "Gây ô nhiễm", "Không ảnh hưởng"],
        correct: 1,
      },
      {
        question: "Hành động nào giúp tiết kiệm nước khi rửa bát?",
        options: ["Ngâm bát lâu", "Rửa từng chiếc", "Rửa dưới vòi chảy", "Tắt vòi khi không dùng"],
        correct: 3,
      },
      {
        question: "Lãng phí thực phẩm gây ra vấn đề gì?",
        options: ["Tăng sản xuất nông nghiệp", "Giảm khí thải", "Tăng rác hữu cơ và khí metan", "Không ảnh hưởng"],
        correct: 2,
      },
      {
        question: "Hành động nào giúp giảm lãng phí thực phẩm?",
        options: ["Mua số lượng lớn", "Lưu trữ thực phẩm đúng cách", "Vứt thực phẩm thừa ngay", "Không kiểm tra hạn sử dụng"],
        correct: 1,
      },
      {
        question: "Việc sử dụng vòi nước tiết kiệm giúp gì?",
        options: ["Tăng áp suất nước", "Giảm lượng nước tiêu thụ", "Tăng chi phí", "Không ảnh hưởng"],
        correct: 1,
      },
    ],
  },
  {
    id: 6,
    title: "Bài 6: Lựa Chọn Sản Phẩm Xanh",
    icon: "checkmark-circle",
    color: "#8BC34A",
    level: "Advanced",
    questions: [
      {
        question: "Ăn ít thịt hơn có tác dụng gì?",
        options: ["Tăng cân", "Giảm khí thải carbon", "Tốn tiền", "Không có tác dụng"],
        correct: 1,
      },
      {
        question: "Mua sản phẩm địa phương có lợi ích gì?",
        options: ["Tốn tiền", "Hỗ trợ kinh tế địa phương và giảm vận chuyển", "Chất lượng kém", "Không có lợi ích"],
        correct: 1,
      },
      {
        question: "Năng lượng mặt trời là nguồn năng lượng gì?",
        options: ["Tái tạo", "Không tái tạo", "Khí đốt", "Dầu mỏ"],
        correct: 0,
      },
      {
        question: "Sản phẩm bảo vệ môi trường thường có đặc điểm gì?",
        options: ["Có logo xanh", "Giảm ô nhiễm", "Tái chế được", "Tất cả đều đúng"],
        correct: 3,
      },
      {
        question: "Hành động nào giúp giảm rác thải nhựa ở trường học?",
        options: ["Sử dụng bình nước, hộp cơm riêng", "Vứt rác ra sân", "Mua nhiều túi nilon", "Không hành động"],
        correct: 0,
      },
      // Mới
      {
        question: "Sản phẩm xanh thường được làm từ chất liệu gì?",
        options: ["Nhựa dùng một lần", "Vật liệu tái chế hoặc phân hủy sinh học", "Kim loại nặng", "Hóa chất độc hại"],
        correct: 1,
      },
      {
        question: "Chứng nhận nào thường xuất hiện trên sản phẩm thân thiện môi trường?",
        options: ["ISO 9001", "FSC (Forest Stewardship Council)", "CE Mark", "RoHS"],
        correct: 1,
      },
      {
        question: "Việc sử dụng túi giấy thay vì túi nhựa có lợi ích gì?",
        options: ["Tăng ô nhiễm", "Dễ phân hủy hơn", "Tốn tài nguyên hơn", "Không ảnh hưởng"],
        correct: 1,
      },
      {
        question: "Sản phẩm nào sau đây thân thiện với môi trường nhất?",
        options: ["Chai nhựa dùng một lần", "Bình nước inox", "Túi nilon", "Hộp xốp"],
        correct: 1,
      },
      {
        question: "Tại sao nên chọn sản phẩm có bao bì tối giản?",
        options: ["Đẹp mắt hơn", "Giảm rác thải", "Tăng giá sản phẩm", "Không ảnh hưởng"],
        correct: 1,
      },
    ],
  },
];

  const dailyTips = [
    { id: 1, icon: "bulb", color: "#FFA726", tip: "Tắt điện khi ra ngoài", impact: "Tiết kiệm 10% hóa đơn điện" },
    { id: 2, icon: "bag-handle", color: "#66BB6A", tip: "Mang túi vải đi chợ", impact: "Giảm 500g rác nhựa/tháng" },
    { id: 3, icon: "water", color: "#42A5F5", tip: "Tắm nước nhanh gọn", impact: "Tiết kiệm 50L nước/ngày" },
    { id: 4, icon: "bicycle", color: "#26A69A", tip: "Đi xe đạp/đi bộ thay xe máy", impact: "Giảm 2kg CO2/ngày" },
    { id: 5, icon: "leaf", color: "#8BC34A", tip: "Trồng cây xanh trong nhà", impact: "Cải thiện chất lượng không khí" },
    { id: 6, icon: "nutrition", color: "#FFA726", tip: "Ăn ít thịt hơn", impact: "Giảm khí thải carbon" },
    { id: 7, icon: "cart", color: "#66BB6A", tip: "Mua sản phẩm địa phương", impact: "Hỗ trợ kinh tế địa phương" },
    { id: 8, icon: "calendar", color: "#42A5F5", tip: "Mua thực phẩm theo mùa", impact: "Giảm năng lượng trồng trọt" },
    { id: 9, icon: "water", color: "#26A69A", tip: "Uống nước máy thay nước đóng chai", impact: "Giảm rác nhựa" },
    { id: 10, icon: "cart", color: "#8BC34A", tip: "Lập kế hoạch mua sắm", impact: "Giảm rác hữu cơ" },
  ];

  const library = [
    {
      id: 1,
      type: "article",
      icon: "document-text",
      color: "#4CAF50",
      title: "Tình trạng rác thải nhựa, túi ni‑lông và vấn nạn ô nhiễm trắng",
      duration: "5 phút đọc",
      views: 1234,
      url: "https://ntt.edu.vn/tinh-trang-rac-thai-nhua-nilon-va-van-nan-ve-o-nhiem-trang/"
    },
    {
      id: 2,
      type: "video",
      icon: "play-circle",
      color: "#2196F3",
      title: "Infographic: Những hành động thiết thực bảo vệ môi trường",
      duration: "8 phút",
      views: 3456,
      url: "https://thoibaotaichinhvietnam.vn/infographic-nhung-hanh-dong-thiet-thuc-bao-ve-moi-truong-92147.html"
    },
    {
      id: 3,
      type: "infographic",
      icon: "analytics",
      color: "#FF9800",
      title: "Infographic: Tổng quan về chất lượng môi trường tại Việt Nam năm 2023",
      duration: "3 phút xem",
      views: 2345,
      url: "https://moitruong.net.vn/infographic-tong-quan-ve-chat-luong-moi-truong-tai-viet-nam-nam-2023-74557.html"
    },
    {
      id: 4,
      type: "article",
      icon: "document-text",
      color: "#4CAF50",
      title: "Giải pháp xử lý rác thải nhựa để bảo vệ môi trường xanh – sạch",
      duration: "7 phút đọc",
      views: 4567,
      url: "https://moitruongachau.com/vn/giai-phap-xu-ly-rac-thai-nhua-de-bao-ve-moi-truong-xanh-sach.html"
    },
    {
      id: 5,
      type: "video",
      icon: "play-circle",
      color: "#2196F3",
      title: "Infographic: Hướng dẫn phân loại và quản lý chất thải rắn",
      duration: "12 phút",
      views: 2890,
      url: "https://www.vietnamplus.vn/infographics-phan-loai-chat-thai-ran-sinh-hoat-tai-nguon-post901919.vnp"
    },
    {
      id: 6,
      type: "infographic",
      icon: "analytics",
      color: "#FF9800",
      title: "Infographic: Những mẫu thiết kế bảo vệ môi trường",
      duration: "3 phút xem",
      views: 1500,
      url: "https://www.canva.com/vi_vn/mau/s/bao-ve-moi-truong/"
    },
    {
      id: 7,
      type: "article",
      icon: "document-text",
      color: "#4CAF50",
      title: "Ngày Môi trường Thế giới – Vì sao và làm gì?",
      duration: "6 phút đọc",
      views: 3200,
      url: "https://moitruong.net.vn/ngay-moi-truong-the-gioi-5-6-nguon-goc-y-nghia-74851.html"
    },
    {
      id: 8,
      type: "article",
      icon: "document-text",
      color: "#4CAF50",
      title: "Bảo vệ môi trường là trách nhiệm của toàn xã hội",
      duration: "5 phút đọc",
      views: 2200,
      url: "http://moitruong.vioit.org.vn/bao-ve-moi-truong-la-trach-nhiem-cua-toan-xa-hoi-2.26.html"
    },
    {
      id: 9,
      type: "article",
      icon: "document-text",
      color: "#4CAF50",
      title: "Bảo vệ môi trường là gì? 5 biện pháp thiết thực bạn cần biết",
      duration: "6 phút đọc",
      views: 2100,
      url: "https://luatvietnam.vn/linh-vuc-khac/bao-ve-moi-truong-la-gi-883-93235-article.html"
    },
    {
      id: 10,
      type: "video",
      icon: "play-circle",
      color: "#2196F3",
      title: "Video: Bảo vệ môi trường di sản thiên nhiên",
      duration: "4 phút",
      views: 1800,
      url: "https://youtu.be/emqL5y4Zb9Y?si=OlRFczVZ9H38_aQU"
    },
  ];

  const handleAnswer = (selectedIndex) => {
    const currentQuiz = quizzes.find(q => q.id === selectedQuizId);
    if (selectedIndex === currentQuiz.questions[currentQuestion].correct) {
      setScore(score + 1);
    }

    if (currentQuestion < currentQuiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResult(true);
    }
  };

  const resetQuiz = () => {
    const currentQuiz = quizzes.find(q => q.id === selectedQuizId);
    const newRecord = {
      id: Date.now(),
      quizId: selectedQuizId,
      quizTitle: currentQuiz.title,
      score: score,
      total: currentQuiz.questions.length,
      percentage: Math.round((score / currentQuiz.questions.length) * 100),
      date: new Date().toLocaleDateString("vi-VN"),
      time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };

    setQuizHistory([newRecord, ...quizHistory]);

    setCurrentQuestion(0);
    setScore(0);
    setShowResult(false);
    setShowQuiz(false);
    setSelectedQuizId(null);
  };

  const handleCheckTip = (id) => {
    if (!completedTips.includes(id)) {
      setCompletedTips([...completedTips, id]);
    } else {
      setCompletedTips(completedTips.filter((tipId) => tipId !== id));
    }
  };

  const totalQuizzes = quizHistory.length;
  const averageScore = totalQuizzes > 0 
    ? Math.round(quizHistory.reduce((sum, q) => sum + q.percentage, 0) / totalQuizzes)
    : 0;

  const getAchievements = () => {
    const achievements = [];
    const perfectQuizzes = quizHistory.filter(q => q.percentage === 100).length;
    const excellentQuizzes = quizHistory.filter(q => q.percentage >= 80).length;
    
    if (totalQuizzes >= 1) {
      achievements.push({
        id: 1, icon: "play-circle", color: "#4CAF50", title: "Nhà Đầu Quân", desc: "Hoàn thành quiz đầu tiên", rarity: "common",
      });
    }

    if (totalQuizzes >= 3) {
      achievements.push({
        id: 2, icon: "flame", color: "#FF6B6B", title: "🔥 Chuỗi Học Tập", desc: "Hoàn thành 3 quiz", rarity: "rare",
      });
    }

    if (totalQuizzes >= 6) {
      achievements.push({
        id: 3, icon: "school", color: "#2196F3", title: "📚 Nhà Bác Học", desc: "Hoàn thành 6 quiz", rarity: "rare",
      });
    }

    if (perfectQuizzes >= 1) {
      achievements.push({
        id: 4, icon: "star", color: "#FFD700", title: "⭐ Hoàn Hảo", desc: "Đạt 100% một bài", rarity: "epic",
      });
    }

    if (perfectQuizzes >= 3) {
      achievements.push({
        id: 5, icon: "sparkles", color: "#FFD700", title: "✨ Ba Lần Hoàn Hảo", desc: "Đạt 100% trong 3 bài", rarity: "legendary",
      });
    }

    if (excellentQuizzes >= 3) {
      achievements.push({
        id: 6, icon: "shield-checkmark", color: "#E53935", title: "🛡️ Chiến Binh", desc: "Có 3 bài điểm ≥ 80%", rarity: "rare",
      });
    }

    if (excellentQuizzes >= 6 && averageScore >= 80) {
      achievements.push({
        id: 7, icon: "nuclear", color: "#FF1744", title: "⚔️🔥 CHIẾN THẦN", desc: "6 bài ≥80%, avg≥80%", rarity: "mythic",
      });
    }

    return achievements;
  };

  const renderLibrary = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Thư viện kiến thức</Text>
      {library.map((item) => (
        <TouchableOpacity key={item.id} style={styles.libraryCard} onPress={() => Linking.openURL(item.url)}>
          <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
            <Ionicons name={item.icon} size={28} color="#fff" />
          </View>
          <View style={styles.libraryContent}>
            <Text style={styles.libraryTitle}>{item.title}</Text>
            <View style={styles.libraryMeta}>
              <Text style={styles.metaText}><Ionicons name="time-outline" size={14} /> {item.duration}</Text>
              <Text style={styles.metaText}><Ionicons name="eye-outline" size={14} /> {item.views}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderQuizTab = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>📚 Chọn Bài Quiz</Text>
      <Text style={styles.subtitle}>Hãy bấm vào bài bạn muốn làm</Text>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalQuizzes}</Text>
          <Text style={styles.statLabel}>Đã làm</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{averageScore}%</Text>
          <Text style={styles.statLabel}>Trung bình</Text>
        </View>
      </View>

      {quizzes.map((quiz) => {
        const quizResult = quizHistory.find(h => h.quizId === quiz.id);
        return (
          <TouchableOpacity
            key={quiz.id}
            style={[styles.quizCard, quizResult && styles.quizCardCompleted]}
            onPress={() => {
              setSelectedQuizId(quiz.id);
              setShowQuiz(true);
              setCurrentQuestion(0);
              setScore(0);
              setShowResult(false);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.quizIconBox, { backgroundColor: quiz.color }]}>
              <Ionicons name={quiz.icon} size={36} color="#fff" />
              {quizResult && (
                <View style={styles.checkmarkOverlay}>
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                </View>
              )}
            </View>
            
            <View style={styles.quizInfo}>
              <Text style={styles.quizTitle}>{quiz.title}</Text>
              <Text style={styles.quizLevel}>{quiz.level} • {quiz.questions.length} câu hỏi</Text>
              {quizResult && (
                <View style={[styles.resultBadgeNew, { backgroundColor: quizResult.percentage >= 80 ? "#4CAF50" : "#FFA726" }]}>
                  <Text style={styles.resultBadgeTextNew}>✓ {quizResult.percentage}%</Text>
                </View>
              )}
            </View>
            
            <Ionicons name="chevron-forward" size={24} color="#999" />
          </TouchableOpacity>
        );
      })}

      <Text style={styles.subsectionTitle}>🏆 Thành Tích</Text>
      {getAchievements().length > 0 ? (
        getAchievements().map((achievement) => (
          <View key={achievement.id} style={[
            styles.achievementCard,
            achievement.rarity === "mythic" && styles.achievementMythic,
            achievement.rarity === "legendary" && styles.achievementLegendary,
            achievement.rarity === "epic" && styles.achievementEpic,
          ]}>
            <View style={[styles.achievementIcon, { backgroundColor: achievement.color }]}>
              <Ionicons name={achievement.icon} size={24} color="#fff" />
            </View>
            <View style={styles.achievementContent}>
              <Text style={[styles.achievementTitle, achievement.rarity === "mythic" && styles.titleMythic]}>
                {achievement.title}
              </Text>
              <Text style={styles.achievementDesc}>{achievement.desc}</Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyAchievement}>
          <Ionicons name="star-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>Hãy bắt đầu quiz để mở khóa thành tích</Text>
        </View>
      )}

      {quizHistory.length > 0 && (
        <>
          <Text style={styles.subsectionTitle}>📊 Lịch Sử Gần Đây</Text>
          {quizHistory.slice(0, 5).map((record) => (
            <View key={record.id} style={styles.historyCard}>
              <View style={styles.historyLeft}>
                <Text style={styles.historyScore}>{record.quizTitle}</Text>
                <Text style={styles.historyDate}>{record.date} - {record.score}/{record.total}</Text>
              </View>
              <View style={[styles.historyBadge, { backgroundColor: record.percentage >= 80 ? "#4CAF50" : "#FFA726" }]}>
                <Text style={styles.historyPercentage}>{record.percentage}%</Text>
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );

  const renderDailyTips = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Hành Động Mỗi Ngày</Text>
      <Text style={styles.subtitle}>Những thói quen nhỏ tạo nên sự khác biệt</Text>

      {dailyTips.map((tip) => (
        <View key={tip.id} style={styles.tipCard}>
          <View style={[styles.tipIcon, { backgroundColor: tip.color }]}>
            <Ionicons name={tip.icon} size={24} color="#fff" />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>{tip.tip}</Text>
            <Text style={styles.tipImpact}>✨ {tip.impact}</Text>
          </View>
          <TouchableOpacity onPress={() => handleCheckTip(tip.id)}>
            <Ionicons
              name={completedTips.includes(tip.id) ? "checkmark-circle" : "checkmark-circle-outline"}
              size={28}
              color="#4CAF50"
            />
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.streakCard}>
        <Ionicons name="flame" size={48} color="#FF6B6B" />
        <Text style={styles.streakNumber}>
          {completedTips.length > 0 ? `${completedTips.length} ngày` : "0 ngày"}
        </Text>
        <Text style={styles.streakText}>Chuỗi hành động!</Text>
      </View>
    </ScrollView>
  );

  const currentQuiz = quizzes.find(q => q.id === selectedQuizId);
  const currentQuizQuestions = currentQuiz?.questions || [];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="book" size={60} color="#2e7d32" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "library" && styles.activeTab]}
          onPress={() => setActiveTab("library")}
        >
          <Ionicons name="library" size={22} color={activeTab === "library" ? "#2e7d32" : "#999"} />
          <Text style={[styles.tabText, activeTab === "library" && styles.activeTabText]}>Thư viện</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "quiz" && styles.activeTab]}
          onPress={() => setActiveTab("quiz")}
        >
          <Ionicons name="school" size={22} color={activeTab === "quiz" ? "#2e7d32" : "#999"} />
          <Text style={[styles.tabText, activeTab === "quiz" && styles.activeTabText]}>Quiz</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "tips" && styles.activeTab]}
          onPress={() => setActiveTab("tips")}
        >
          <Ionicons name="bulb" size={22} color={activeTab === "tips" ? "#2e7d32" : "#999"} />
          <Text style={[styles.tabText, activeTab === "tips" && styles.activeTabText]}>Mỗi ngày</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === "library" && renderLibrary()}
      {activeTab === "quiz" && renderQuizTab()}
      {activeTab === "tips" && renderDailyTips()}

      {/* Quiz Modal */}
      <Modal visible={showQuiz} animationType="slide" onRequestClose={() => setShowQuiz(false)}>
        <View style={styles.quizContainer}>
          {!showResult ? (
            <>
              <TouchableOpacity
                style={styles.closeQuizButton}
                onPress={() => {
                  setShowQuiz(false);
                  setSelectedQuizId(null);
                }}
              >
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>

              <View style={styles.quizProgress}>
                <Text style={styles.progressText}>
                  Câu {currentQuestion + 1}/{currentQuizQuestions.length}
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${((currentQuestion + 1) / currentQuizQuestions.length) * 100}%` },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.questionCard}>
                <Text style={styles.questionText}>
                  {currentQuizQuestions[currentQuestion]?.question}
                </Text>
              </View>

              <View style={styles.optionsContainer}>
                {currentQuizQuestions[currentQuestion]?.options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.optionButton}
                    onPress={() => handleAnswer(index)}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            <ScrollView contentContainerStyle={styles.resultContainer}>
              <View style={styles.resultContent}>
                <Ionicons
                  name={score >= currentQuizQuestions.length * 0.8 ? "trophy" : score >= currentQuizQuestions.length * 0.6 ? "ribbon" : "sad"}
                  size={100}
                  color={score >= currentQuizQuestions.length * 0.8 ? "#FFD700" : score >= currentQuizQuestions.length * 0.6 ? "#4CAF50" : "#E53935"}
                />

                <Text style={styles.resultTitle}>
                  {score >= currentQuizQuestions.length * 0.8
                    ? "🎉 Xuất Sắc!"
                    : score >= currentQuizQuestions.length * 0.6
                    ? "👍 Khá Tốt!"
                    : "💪 Cố Gắng Lên!"}
                </Text>

                <View style={styles.resultScoreBox}>
                  <Text style={styles.resultScore}>{score}/{currentQuizQuestions.length}</Text>
                  <Text style={styles.resultPercentage}>{Math.round((score / currentQuizQuestions.length) * 100)}%</Text>
                </View>

                <Text style={styles.resultMessage}>
                  {score >= currentQuizQuestions.length * 0.8
                    ? "🌟 Bạn là chuyên gia!"
                    : score >= currentQuizQuestions.length * 0.6
                    ? "📚 Kiến thức tốt, tiếp tục học!"
                    : "📖 Hãy học thêm ở Thư viện!"}
                </Text>

                <View style={styles.resultStats}>
                  <View style={styles.resultStatItem}>
                    <Text style={styles.resultStatLabel}>Đúng</Text>
                    <Text style={styles.resultStatValue}>{score}</Text>
                  </View>
                  <View style={styles.resultStatItem}>
                    <Text style={styles.resultStatLabel}>Sai</Text>
                    <Text style={styles.resultStatValue}>{currentQuizQuestions.length - score}</Text>
                  </View>
                  <View style={styles.resultStatItem}>
                    <Text style={styles.resultStatLabel}>Tỉ lệ</Text>
                    <Text style={styles.resultStatValue}>{Math.round((score / currentQuizQuestions.length) * 100)}%</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.retryButton} onPress={resetQuiz}>
                  <Ionicons name="refresh" size={20} color="#fff" />
                  <Text style={styles.retryText}>Làm Lại</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.closeButton} onPress={() => {
                  setShowQuiz(false);
                  setSelectedQuizId(null);
                }}>
                  <Text style={styles.closeText}>Đóng</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

// STYLES
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5" },
  loadingText: { fontSize: 16, color: "#666", marginTop: 16, fontWeight: "600" },
  tabs: { flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e0e0e0" },
  tab: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 15 },
  activeTab: { borderBottomWidth: 3, borderBottomColor: "#2e7d32" },
  tabText: { fontSize: 14, color: "#999", marginLeft: 6 },
  activeTabText: { color: "#2e7d32", fontWeight: "bold" },
  content: { flex: 1 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", color: "#333", margin: 15, marginBottom: 10 },
  subtitle: { fontSize: 14, color: "#666", marginHorizontal: 15, marginBottom: 15 },
  subsectionTitle: { fontSize: 16, fontWeight: "bold", color: "#333", marginHorizontal: 15, marginTop: 20, marginBottom: 10 },
  libraryCard: { backgroundColor: "#fff", marginHorizontal: 15, marginBottom: 12, padding: 15, borderRadius: 12, flexDirection: "row", alignItems: "center", elevation: 2 },
  iconCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: "center", alignItems: "center", marginRight: 15 },
  libraryContent: { flex: 1 },
  libraryTitle: { fontSize: 15, fontWeight: "600", color: "#333", marginBottom: 6 },
  libraryMeta: { flexDirection: "row", gap: 15 },
  metaText: { fontSize: 12, color: "#666" },
  statsCard: { backgroundColor: "#fff", marginHorizontal: 15, marginBottom: 20, padding: 20, borderRadius: 12, flexDirection: "row", elevation: 2 },
  statItem: { flex: 1, alignItems: "center" },
  statNumber: { fontSize: 28, fontWeight: "bold", color: "#2e7d32" },
  statLabel: { fontSize: 12, color: "#666", marginTop: 4, textAlign: "center" },
  statDivider: { width: 1, backgroundColor: "#e0e0e0" },
  quizCard: { backgroundColor: "#fff", marginHorizontal: 15, marginBottom: 15, padding: 16, borderRadius: 16, flexDirection: "row", alignItems: "center", elevation: 3, borderLeftWidth: 5, borderLeftColor: "#e0e0e0" },
  quizCardCompleted: { borderLeftColor: "#4CAF50", backgroundColor: "#f8fff6" },
  quizIconBox: { width: 64, height: 64, borderRadius: 16, justifyContent: "center", alignItems: "center", marginRight: 16, position: "relative" },
  checkmarkOverlay: { position: "absolute", bottom: -5, right: -5, backgroundColor: "#fff", borderRadius: 12, padding: 2 },
  quizInfo: { flex: 1 },
  quizTitle: { fontSize: 16, fontWeight: "700", color: "#333", marginBottom: 6 },
  quizLevel: { fontSize: 13, color: "#999", marginBottom: 8 },
  resultBadgeNew: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  resultBadgeTextNew: { fontSize: 12, fontWeight: "bold", color: "#fff" },
  achievementCard: { backgroundColor: "#fff", marginHorizontal: 15, marginBottom: 10, padding: 15, borderRadius: 12, flexDirection: "row", alignItems: "center", elevation: 2, borderLeftWidth: 4, borderLeftColor: "#4CAF50" },
  achievementMythic: { backgroundColor: "#1a1a2e", borderLeftColor: "#FF1744", elevation: 5 },
  achievementLegendary: { backgroundColor: "#fff8e1", borderLeftColor: "#FFD700", elevation: 4 },
  achievementEpic: { backgroundColor: "#f3e5f5", borderLeftColor: "#9C27B0", elevation: 3 },
  achievementIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center", marginRight: 12 },
  achievementContent: { flex: 1 },
  achievementTitle: { fontSize: 15, fontWeight: "bold", color: "#333" },
  titleMythic: { color: "#FF1744", fontSize: 16 },
  achievementDesc: { fontSize: 12, color: "#666", marginTop: 2 },
  emptyAchievement: { backgroundColor: "#fff", marginHorizontal: 15, padding: 30, borderRadius: 12, alignItems: "center" },
  emptyText: { fontSize: 14, color: "#999" },
  historyCard: { backgroundColor: "#fff", marginHorizontal: 15, marginBottom: 10, padding: 15, borderRadius: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", elevation: 2 },
  historyLeft: { flex: 1 },
  historyScore: { fontSize: 14, fontWeight: "600", color: "#333" },
  historyDate: { fontSize: 12, color: "#999", marginTop: 4 },
  historyBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  historyPercentage: { fontSize: 13, fontWeight: "bold", color: "#fff" },
  tipCard: { backgroundColor: "#fff", marginHorizontal: 15, marginBottom: 12, padding: 15, borderRadius: 12, flexDirection: "row", alignItems: "center", elevation: 2 },
  tipIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center", marginRight: 12 },
  tipContent: { flex: 1 },
  tipTitle: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 3 },
  tipImpact: { fontSize: 12, color: "#666" },
  streakCard: { backgroundColor: "#fff", marginHorizontal: 15, marginVertical: 20, padding: 30, borderRadius: 12, alignItems: "center", elevation: 2 },
  streakNumber: { fontSize: 32, fontWeight: "bold", color: "#FF6B6B", marginTop: 10 },
  streakText: { fontSize: 16, color: "#666", marginTop: 5 },
  quizContainer: { flex: 1, backgroundColor: "#f5f5f5", paddingHorizontal: 20 },
  closeQuizButton: { marginTop: 15, marginBottom: 10, alignSelf: "flex-start", padding: 10 },
  quizProgress: { marginTop: 15, marginBottom: 30 },
  progressText: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 10 },
  progressBar: { height: 8, backgroundColor: "#e0e0e0", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#2e7d32" },
  questionCard: { backgroundColor: "#fff", padding: 25, borderRadius: 15, marginBottom: 25, elevation: 3 },
  questionText: { fontSize: 18, fontWeight: "600", color: "#333", lineHeight: 26 },
  optionsContainer: { gap: 12, paddingBottom: 20 },
  optionButton: { backgroundColor: "#fff", padding: 18, borderRadius: 12, borderWidth: 2, borderColor: "#e0e0e0", elevation: 2 },
  optionText: { fontSize: 15, color: "#333" },
  resultContainer: { flexGrow: 1, justifyContent: "center" },
  resultContent: { alignItems: "center", paddingVertical: 40 },
  resultTitle: { fontSize: 28, fontWeight: "bold", color: "#333", marginTop: 20 },
  resultScoreBox: { backgroundColor: "#fff", paddingHorizontal: 40, paddingVertical: 25, borderRadius: 20, marginTop: 25, marginBottom: 20, alignItems: "center", elevation: 5 },
  resultScore: { fontSize: 40, fontWeight: "bold", color: "#2e7d32" },
  resultPercentage: { fontSize: 18, fontWeight: "bold", color: "#666", marginTop: 8 },
  resultMessage: { fontSize: 15, color: "#666", textAlign: "center", marginHorizontal: 20, lineHeight: 22 },
  resultStats: { flexDirection: "row", marginTop: 25, gap: 12 },
  resultStatItem: { backgroundColor: "#fff", paddingHorizontal: 15, paddingVertical: 12, borderRadius: 12, flex: 1, alignItems: "center", elevation: 2 },
  resultStatLabel: { fontSize: 11, color: "#999" },
  resultStatValue: { fontSize: 18, fontWeight: "bold", color: "#2e7d32", marginTop: 4 },
  retryButton: { backgroundColor: "#2e7d32", flexDirection: "row", paddingHorizontal: 40, paddingVertical: 14, borderRadius: 25, marginTop: 30, alignItems: "center", gap: 8 },
  retryText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  closeButton: { marginTop: 12, padding: 12 },
  closeText: { color: "#666", fontSize: 15 },
});