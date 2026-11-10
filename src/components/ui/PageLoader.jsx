import Spinner from './Spinner';

export default function PageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#E8EDF5]">
      <Spinner className="text-primary-600 h-40 w-40" />
    </div>
  );
}
