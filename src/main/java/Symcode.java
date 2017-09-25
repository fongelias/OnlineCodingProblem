package io.yetanotherwhatever;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.stream.Stream;

/**
 * Created by achang on 2/14/2017.
 */
public class Symcode {

    public static void main(String args[])
    {

        try (Stream<String> stream = Files.lines(Paths.get(args[0]))) {
            stream.map(s->symcode(s)).forEach(s -> System.out.println((s)));

        } catch (IOException ioe)
        {

        }

        //test();
    }

    public static String symcode(String in)
    {
        in = in.trim();

        char[] codes = new char[]{'s', 'y', 'm', 'a', 'n', 't', 'e', 'c'};

        byte[] bytes = in.getBytes();

        int padBytes = (3 - bytes.length%3) % 3;

        StringBuilder sb = new StringBuilder();

        for (int i = 0; i < bytes.length; i+=3)
        {
            boolean lastBlock = i+3 >= bytes.length;

            //store 3 bytes in an int
            int block = 0;
            block = bytes[i]<<24;

            if (!lastBlock || padBytes < 2)
                block = block | (bytes[i+1]<<16);

            if (!lastBlock || padBytes < 1)
                block = block | (bytes[i+2]<<8);

            //
            int shift = 8*4-3;
            int mask = 7;
            mask = mask<<shift;    //binary 1110 0000...

            for (int j = 0; j < 8; j++)
            {
                int temp = block & mask;
                int index = temp >>> shift;
                char code = codes[index];
                sb.append(code);

                mask = mask >>> 3;
                shift -=3;
            }
        }

        //replace padding
        if (padBytes == 2)
        {
            sb.replace(sb.length() - 5, sb.length(), "$$$$$");
        }
        else if (padBytes == 1)
        {
            sb.replace(sb.length() - 2, sb.length(), "$$");
        }

        return sb.toString();
    }



    public static void test()
    {
        String foo = "/t'Twas brillig, and the slithy toves\n" +
                "/tDid gyre and gimble in the wabe:\n" +
                "/tAll mimsy were the borogoves,\n" +
                "/tAnd the mome raths outgrabe.";

        System.out.println(symcode(foo));
    }

}
