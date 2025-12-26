import Link from 'next/link';

export default function RulesPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">قوانین و مقررات</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          استفاده از خدمات این وب‌سایت به منزله پذیرش کامل قوانین و مقررات زیر است.
        </p>
      </div>

      <div className="space-y-8 leading-8">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1) تعاریف</h2>
          <div className="text-sm text-muted-foreground">
            <p>
              در این سند، منظور از «سایت» همین سامانه قرعه‌کشی آنلاین و منظور از «کاربر»، هر شخصی است که از
              امکانات سایت استفاده می‌کند.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2) شرایط عضویت و احراز هویت</h2>
          <div className="text-sm text-muted-foreground">
            <p>
              ثبت‌نام و ورود در سایت از طریق شماره موبایل و کد یکبار مصرف انجام می‌شود. کاربر متعهد است اطلاعات
              تماس خود را صحیح وارد کند.
            </p>
            <p>
              در صورت مشاهده هرگونه سوءاستفاده، تلاش برای نفوذ، ایجاد اختلال یا رفتارهای مغایر با قوانین، سایت حق
              محدودسازی یا مسدودسازی دسترسی کاربر را دارد.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3) قوانین شرکت در قرعه‌کشی</h2>
          <div className="text-sm text-muted-foreground">
            <p>
              شرکت در قرعه‌کشی منوط به پرداخت هزینه شرکت در دوره فعال است. پس از ثبت پرداخت موفق، یک یا چند کد
              قرعه‌کشی به کاربر اختصاص داده می‌شود.
            </p>
            <p>
              ظرفیت، زمان‌بندی، وضعیت دوره‌ها و تعداد برندگان ممکن است توسط مدیریت سایت مطابق سیاست‌های اجرایی
              تغییر کند.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4) پرداخت‌ها، عودت وجه و خطاهای تراکنش</h2>
          <div className="text-sm text-muted-foreground">
            <p>
              پرداخت‌ها از طریق درگاه پرداخت انجام می‌شود. مسئولیت صحت اطلاعات کارت بانکی، رمز پویا و تأیید
              پرداخت بر عهده کاربر است.
            </p>
            <p>
              در صورت بروز خطای بانکی یا ناموفق بودن تراکنش، مبلغ از سمت درگاه طبق قوانین شبکه بانکی طی بازه زمانی
              مربوطه به حساب پرداخت‌کننده بازمی‌گردد.
            </p>
            <p>
              اگر پرداخت موفق ثبت شود ولی کد قرعه‌کشی صادر نگردد، کاربر می‌تواند از طریق بخش «نظرات و پیشنهادات»
              موضوع را پیگیری کند.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5) اعلام برندگان و مسئولیت‌ها</h2>
          <div className="text-sm text-muted-foreground">
            <p>
              نتایج قرعه‌کشی از طریق پنل کاربری قابل مشاهده است. هرگونه ادعا باید با ارائه اطلاعات معتبر و در
              چهارچوب قوانین بررسی شود.
            </p>
            <p>
              سایت در قبال اختلالات ناشی از اینترنت، سرویس‌دهنده‌ها، یا مشکلات خارج از کنترل (مانند قطع سرویس)
              مسئولیتی ندارد؛ با این حال تلاش می‌کند خدمات را پایدار ارائه دهد.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6) حریم خصوصی</h2>
          <div className="text-sm text-muted-foreground">
            <p>
              سایت صرفاً اطلاعات ضروری مانند شماره موبایل و سوابق شرکت در قرعه‌کشی را برای ارائه خدمات نگهداری
              می‌کند.
            </p>
            <p>
              اطلاعات کاربران بدون حکم قانونی یا ضرورت‌های فنی برای ارائه سرویس، در اختیار شخص ثالث قرار نخواهد
              گرفت.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7) مالکیت معنوی</h2>
          <div className="text-sm text-muted-foreground">
            <p>
              کلیه حقوق مادی و معنوی محتوای سایت (از جمله طراحی، نام، نشان و کدها) متعلق به سایت بوده و هرگونه
              کپی‌برداری بدون اجازه کتبی ممنوع است.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8) تغییرات قوانین</h2>
          <div className="text-sm text-muted-foreground">
            <p>
              سایت می‌تواند در هر زمان قوانین را بروزرسانی کند. نسخه جدید از طریق همین صفحه در دسترس خواهد بود.
              ادامه استفاده از سایت به معنی پذیرش نسخه جدید است.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">9) تماس با ما</h2>
          <div className="text-sm text-muted-foreground">
            <p>
              برای هرگونه پرسش، پیشنهاد یا گزارش مشکل می‌توانید از دکمه «نظرات و پیشنهادات» در پایین صفحه استفاده
              کنید.
            </p>
          </div>
        </section>

        <div className="pt-6">
          <Link href="/" className="text-sm text-primary hover:underline">
            بازگشت به صفحه اصلی
          </Link>
        </div>
      </div>
    </div>
  );
}
