/**
 * BackgroundPanel Component
 * Displays the left side background image with overlay and branding
 */

export default function BackgroundPanel({
  imageUrl,
  title = 'Hệ thống Quản lý Thư viện',
  subtitle = 'Lan tỏa tri thức, kết nối tương lai'
}) {
  return (
    <div
      className="background-panel"
      style={{ backgroundImage: `url(${imageUrl})` }}
    >
      {/* Warm overlay for better contrast */}
      <div className="background-overlay"></div>

      {/* Content at the bottom */}
      <div className="background-content">
        <h1 className="background-title">{title}</h1>
        <p className="background-subtitle">{subtitle}</p>
      </div>
    </div>
  );
}