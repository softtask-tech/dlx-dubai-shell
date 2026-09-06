INSERT INTO public.agents (slug, full_name, job_title, brn, bio, languages, specialities, linkedin_url, email, phone, whatsapp, display_order, is_active)
VALUES
('shahul-hameed','Shahul Hameed','Chief Executive Officer','67618','I help you build your investment journey in Dubai with one trusted point of contact. Five years advising private buyers on residential sales, leasing and long-term property strategy.',ARRAY['English','Hindi','Malayalam','Kannada'],ARRAY['Residential sales & leasing','Investment strategy','Portfolio advisory'],'https://www.linkedin.com/in/shahul-hameed-83351a9b','info@dlxproperties.com','+971545996911','971545996911',1,true),
('sourez-afrid','Sourez Afrid','Sales Director','61841','Building high-value property portfolios through strategic Dubai investments, with eight years across new sales and resale.',ARRAY['English','Hindi','Malayalam','Kannada'],ARRAY['Portfolio building & management','Residential sales','Resale'],'https://www.linkedin.com/in/sourez-afreed-4185141a0','info@dlxproperties.com','+971545996911','971545996911',2,true),
('fayuros-munavvar','Fayuros Munavvar','Senior Property Consultant',NULL,'Turning commercial opportunities into high-value investments across Dubai, with four years in commercial and residential transactions.',ARRAY['English','Hindi','Malayalam','Tamil','Kannada'],ARRAY['Commercial investment','Residential sales','Leasing'],NULL,'info@dlxproperties.com','+971545996911','971545996911',3,true),
('mohammed-nihal','Mohammed Nihal','Senior Property Consultant','71767','Connecting discerning clients with exceptional homes and rewarding investments across Dubai.',ARRAY['English','Hindi','Malayalam','Kannada'],ARRAY['Residential sales & leasing','Tailored investor solutions'],'https://www.linkedin.com/in/mohammed-nihal-50068621b','info@dlxproperties.com','+971545996911','971545996911',4,true),
('mohammed-hafeez','Mohammed Hafeez','Senior Property Consultant','79946','Your trusted connection to Dubai''s finest residential and off-plan opportunities.',ARRAY['English','Hindi','Malayalam','Tamil','Kannada'],ARRAY['Residential sales & leasing','Off-plan investment'],'https://www.linkedin.com/in/mohammad-hafeez-601969237','info@dlxproperties.com','+971545996911','971545996911',5,true),
('abdul-zakeer','Abdul Zakeer','Senior Property Consultant','84654','Curating exceptional Dubai properties for those who invest with vision, with seven years across off-plan and ready stock.',ARRAY['English','Hindi','Malayalam','Kannada'],ARRAY['Off-plan sales','Ready properties','Market analysis'],'https://www.linkedin.com/in/abdul-zakeer-6b831b1ab','info@dlxproperties.com','+971545996911','971545996911',6,true),
('mohammed-rameez','Mohammed Rameez','Senior Property Consultant','98149','Helping clients buy, sell and rent across Dubai with the right property strategy.',ARRAY['English','Hindi','Malayalam','Kannada'],ARRAY['Ready & resale properties','Off-plan investment'],NULL,'info@dlxproperties.com','+971545996911','971545996911',7,true)
ON CONFLICT (slug) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  job_title = EXCLUDED.job_title,
  brn = EXCLUDED.brn,
  bio = EXCLUDED.bio,
  languages = EXCLUDED.languages,
  specialities = EXCLUDED.specialities,
  linkedin_url = EXCLUDED.linkedin_url,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  whatsapp = EXCLUDED.whatsapp,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active;